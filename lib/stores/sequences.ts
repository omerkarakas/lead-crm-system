import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Sequence,
  SequenceStep,
  SequenceBuilderState,
  StepValidationError,
  BuilderViewMode,
  CreateSequenceDto,
  UpdateSequenceDto,
} from '@/types/campaign';
import * as campaignApi from '@/lib/api/campaigns';

interface SequencesState {
  sequences: Sequence[];
  activeSequence: Sequence | null;
  builderState: SequenceBuilderState | null;
  isStepFormOpen: boolean;
  editingStepIndex: number | null;
  validationErrors: StepValidationError[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSequences: (campaignId: string) => Promise<void>;
  setActiveSequence: (sequence: Sequence | null) => void;
  initBuilder: (campaignId?: string, sequence?: Sequence) => void;
  addStep: (step: SequenceStep) => void;
  updateStep: (index: number, step: SequenceStep) => void;
  deleteStep: (index: number) => void;
  reorderStep: (fromIndex: number, toIndex: number) => void;
  setViewMode: (mode: BuilderViewMode) => void;
  openStepForm: (index: number | null) => void;
  closeStepForm: () => void;
  saveSequence: () => Promise<void>;
  discardChanges: () => void;
  validateSequence: () => StepValidationError[];
  resetBuilder: () => void;
  clearError: () => void;
}

export const useSequencesStore = create<SequencesState>()(
  persist(
    (set, get) => ({
      sequences: [],
      activeSequence: null,
      builderState: null,
      isStepFormOpen: false,
      editingStepIndex: null,
      validationErrors: [],
      loading: false,
      error: null,

      fetchSequences: async (campaignId: string) => {
        set({ loading: true, error: null });
        try {
          const sequences = await campaignApi.fetchSequences(campaignId);
          set({ sequences, loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Sıralar yüklenirken hata oluştu',
            loading: false,
          });
        }
      },

      setActiveSequence: (sequence: Sequence | null) => {
        set({ activeSequence: sequence });
      },

      initBuilder: (campaignId?: string, sequence?: Sequence) => {
        const builderState: SequenceBuilderState = {
          campaign_id: campaignId,
          sequence_id: sequence?.id,
          name: sequence?.name || '',
          steps: sequence?.steps ? [...sequence.steps] : [],
          viewMode: BuilderViewMode.FlowChart,
          isDirty: false,
        };
        set({ builderState, activeSequence: sequence || null });
      },

      addStep: (step: SequenceStep) => {
        const { builderState } = get();
        if (!builderState) return;

        const newStep: SequenceStep = {
          ...step,
          id: step.id || crypto.randomUUID(),
          order: builderState.steps.length + 1,
        };

        set({
          builderState: {
            ...builderState,
            steps: [...builderState.steps, newStep],
            isDirty: true,
          },
        });
      },

      updateStep: (index: number, step: SequenceStep) => {
        const { builderState } = get();
        if (!builderState || index < 0 || index >= builderState.steps.length) return;

        const updatedSteps = [...builderState.steps];
        updatedSteps[index] = { ...step, order: index + 1 };

        set({
          builderState: {
            ...builderState,
            steps: updatedSteps,
            isDirty: true,
          },
        });
      },

      deleteStep: (index: number) => {
        const { builderState } = get();
        if (!builderState || index < 0 || index >= builderState.steps.length) return;

        const updatedSteps = builderState.steps.filter((_, i) => i !== index);
        // Reorder remaining steps
        updatedSteps.forEach((step, i) => {
          step.order = i + 1;
        });

        set({
          builderState: {
            ...builderState,
            steps: updatedSteps,
            isDirty: true,
          },
        });
      },

      reorderStep: (fromIndex: number, toIndex: number) => {
        const { builderState } = get();
        if (!builderState) return;

        const steps = [...builderState.steps];
        const [removed] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, removed);

        // Reorder all steps
        steps.forEach((step, i) => {
          step.order = i + 1;
        });

        set({
          builderState: {
            ...builderState,
            steps,
            isDirty: true,
          },
        });
      },

      setViewMode: (mode: BuilderViewMode) => {
        const { builderState } = get();
        if (!builderState) return;

        set({
          builderState: {
            ...builderState,
            viewMode: mode,
          },
        });
      },

      openStepForm: (index: number | null) => {
        set({
          isStepFormOpen: true,
          editingStepIndex: index,
        });
      },

      closeStepForm: () => {
        set({
          isStepFormOpen: false,
          editingStepIndex: null,
        });
      },

      saveSequence: async () => {
        const { builderState, activeSequence } = get();
        if (!builderState) {
          set({ error: 'Kaydedilecek sıra bulunamadı' });
          return;
        }

        set({ loading: true, error: null });

        try {
          const sequenceData: CreateSequenceDto | UpdateSequenceDto = {
            name: builderState.name,
            steps: builderState.steps,
          };

          if (builderState.sequence_id) {
            // Update existing sequence
            await campaignApi.updateSequence(builderState.sequence_id, sequenceData);
          } else {
            // Create new sequence
            if (!builderState.campaign_id) {
              throw new Error('Kampanya ID gerekli');
            }
            const createData: CreateSequenceDto = {
              ...sequenceData,
              campaign_id: builderState.campaign_id,
            };
            await campaignApi.createSequence(createData);
          }

          // Reload sequences if we have a campaign
          if (builderState.campaign_id) {
            await get().fetchSequences(builderState.campaign_id);
          }

          // Mark as not dirty after successful save
          set({
            builderState: {
              ...builderState,
              isDirty: false,
            },
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Sıra kaydedilirken hata oluştu',
            loading: false,
          });
          throw error;
        }
      },

      discardChanges: () => {
        const { activeSequence } = get();
        if (activeSequence) {
          get().initBuilder(activeSequence.campaign_id, activeSequence);
        } else {
          get().resetBuilder();
        }
      },

      validateSequence: () => {
        const { builderState } = get();
        if (!builderState) return [];

        const errors: StepValidationError[] = [];

        builderState.steps.forEach((step, index) => {
          // Validate email/whatsapp steps have template
          if ((step.type === 'email' || step.type === 'whatsapp') && !step.template_id) {
            errors.push({
              step_id: step.id,
              field: 'template_id',
              message: `Adım ${index + 1}: Şablon seçimi gerekli`,
            });
          }

          // Validate delay steps have proper delay configuration
          if (step.type === 'delay') {
            if (step.delay_type === 'relative' && !step.delay_minutes) {
              errors.push({
                step_id: step.id,
                field: 'delay_minutes',
                message: `Adım ${index + 1}: Gecikme süresi gerekli`,
              });
            }
            if (step.delay_type === 'absolute' && !step.scheduled_time) {
              errors.push({
                step_id: step.id,
                field: 'scheduled_time',
                message: `Adım ${index + 1}: Zamanlama gerekli`,
              });
            }
          }
        });

        set({ validationErrors: errors });
        return errors;
      },

      resetBuilder: () => {
        set({
          builderState: null,
          isStepFormOpen: false,
          editingStepIndex: null,
          validationErrors: [],
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sequences-builder-storage',
      partialize: (state) => ({
        builderState: state.builderState,
      }),
    }
  )
);
