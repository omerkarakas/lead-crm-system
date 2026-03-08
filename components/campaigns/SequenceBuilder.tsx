'use client';

import { useState, useEffect } from 'react';
import { Save, X, List, Network, Plus, Mail, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useSequencesStore } from '@/lib/stores/sequences';
import { SequenceList } from './SequenceList';
import { SequenceFlowChart } from './SequenceFlowChart';
import { SequenceStepForm } from './SequenceStepForm';
import { BuilderViewMode, StepType } from '@/types/campaign';
import type { SequenceStep } from '@/types/campaign';

interface SequenceBuilderProps {
  campaignId?: string;
  sequenceId?: string;
  inline?: boolean;
  sequenceName?: string;
  onSequenceSaved?: (sequenceId: string) => void;
  onSequenceCancelled?: () => void;
}

export function SequenceBuilder({
  campaignId,
  sequenceId,
  inline = false,
  sequenceName: initialSequenceName = '',
  onSequenceSaved,
  onSequenceCancelled,
}: SequenceBuilderProps) {
  const [sequenceName, setSequenceName] = useState(initialSequenceName);
  const [isSaving, setIsSaving] = useState(false);

  const {
    builderState,
    isStepFormOpen,
    editingStepIndex,
    validationErrors,
    initBuilder,
    addStep,
    updateStep,
    deleteStep,
    reorderStep,
    setViewMode,
    openStepForm,
    closeStepForm,
    saveSequence,
    discardChanges,
    resetBuilder,
    clearError,
  } = useSequencesStore();

  // Initialize builder when component mounts or props change
  useEffect(() => {
    if (campaignId || sequenceId) {
      // For existing sequences, we would fetch from API
      // For now, initialize with empty state
      initBuilder(campaignId, sequenceId ? { id: sequenceId, name: sequenceName, steps: [], campaign_id: campaignId || '', is_active: true, created: '', updated: '' } : undefined);
      setSequenceName(initialSequenceName);
    }
    return () => {
      if (!inline) {
        resetBuilder();
      }
    };
  }, [campaignId, sequenceId, initialSequenceName]);

  const steps = builderState?.steps || [];
  const viewMode = builderState?.viewMode || BuilderViewMode.FlowChart;
  const isDirty = builderState?.isDirty || false;

  const handleAddStep = (stepType: string) => {
    openStepForm(null);
    // We'll pass the step type to the form through the store or callback
    // For now, the form will show type selection
  };

  const handleEditStep = (index: number) => {
    openStepForm(index);
  };

  const handleDeleteStep = (index: number) => {
    deleteStep(index);
    toast.success('Adım silindi');
  };

  const handleReorderStep = (from: number, to: number) => {
    reorderStep(from, to);
  };

  const handleStepFormSave = (step: SequenceStep) => {
    if (editingStepIndex !== null && editingStepIndex >= 0) {
      updateStep(editingStepIndex, step);
      toast.success('Adım güncellendi');
    } else {
      addStep(step);
      toast.success('Adım eklendi');
    }
    closeStepForm();
  };

  const handleSave = async () => {
    if (!sequenceName.trim()) {
      toast.error('Lütfen sıra adı girin');
      return;
    }

    if (steps.length === 0) {
      toast.error('En az bir adım ekleyin');
      return;
    }

    // Validate steps
    const errors = validationErrors;
    if (errors.length > 0) {
      toast.error(errors.map(e => e.message).join('\n'));
      return;
    }

    setIsSaving(true);
    try {
      await saveSequence();
      toast.success('Sıra kaydedildi');
      if (onSequenceSaved && builderState?.sequence_id) {
        onSequenceSaved(builderState.sequence_id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Sıra kaydedilirken hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    discardChanges();
    toast.warning('Değişiklikler iptal edildi');
    if (onSequenceCancelled) {
      onSequenceCancelled();
    }
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === BuilderViewMode.Table ? BuilderViewMode.FlowChart : BuilderViewMode.Table;
    setViewMode(newMode);
  };

  if (!builderState && (campaignId || sequenceId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${inline ? '' : 'border rounded-lg p-6'}`}>
      {/* Header */}
      <div className="space-y-4">
        {/* Sequence Name Input */}
        {!inline && (
          <div className="space-y-2">
            <Label htmlFor="sequenceName">Sıra Adı</Label>
            <Input
              id="sequenceName"
              value={sequenceName}
              onChange={(e) => setSequenceName(e.target.value)}
              placeholder="Örn: Hoş Geldin Serisi"
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleViewModeToggle}
              title={viewMode === BuilderViewMode.Table ? 'Akış Şeması' : 'Tablo Görünümü'}
            >
              {viewMode === BuilderViewMode.Table ? (
                <Network className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </Button>

            {/* Step Count Badge */}
            <Badge variant="secondary">
              {steps.length} Adım
            </Badge>

            {isDirty && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Kaydedilmemiş
              </Badge>
            )}
          </div>

          {/* Add Step Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adım Ekle
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddStep(StepType.Email)}>
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Email Adımı
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddStep(StepType.WhatsApp)}>
                <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                WhatsApp Adımı
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddStep(StepType.Delay)}>
                <Clock className="h-4 w-4 mr-2 text-gray-600" />
                Gecikme Adımı
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      {steps.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
          <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Henüz adım eklenmedi</p>
          <p className="text-muted-foreground text-sm mb-6">
            Sıranı oluşturmak için ilk adımı ekleyin
          </p>
          <Button onClick={() => handleAddStep(StepType.Email)}>
            <Plus className="h-4 w-4 mr-2" />
            İlk Adımı Ekle
          </Button>
        </div>
      ) : viewMode === BuilderViewMode.Table ? (
        <SequenceList
          steps={steps}
          onEditStep={handleEditStep}
          onDeleteStep={handleDeleteStep}
          onReorderStep={handleReorderStep}
        />
      ) : (
        <SequenceFlowChart
          steps={steps}
          onEditStep={handleEditStep}
          onDeleteStep={handleDeleteStep}
        />
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-medium mb-2">Doğrulama Hataları:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Actions (only for non-inline mode) */}
      {!inline && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {steps.length > 0 && `${steps.length} adım hazır`}
          </div>
          <div className="flex gap-2">
            {isDirty && (
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || steps.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step Form Modal */}
      <SequenceStepForm
        isOpen={isStepFormOpen}
        onClose={closeStepForm}
        onSave={handleStepFormSave}
        step={editingStepIndex !== null ? steps[editingStepIndex] : undefined}
      />
    </div>
  );
}
