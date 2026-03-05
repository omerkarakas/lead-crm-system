import { create } from 'zustand';
import { ProposalTemplate, CreateProposalTemplateDto, UpdateProposalTemplateDto } from '@/types/proposal';
import * as proposalTemplatesApi from '@/lib/api/proposal-templates';

interface ProposalTemplatesState {
  templates: ProposalTemplate[];
  archivedTemplates: ProposalTemplate[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterActive: boolean | null;
  selectedTemplate: ProposalTemplate | null;
  fetchTemplates: () => Promise<void>;
  fetchArchivedTemplates: () => Promise<void>;
  createTemplate: (data: CreateProposalTemplateDto) => Promise<void>;
  updateTemplate: (id: string, data: UpdateProposalTemplateDto) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  restoreTemplate: (id: string) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterActive: (filter: boolean | null) => void;
  setSelectedTemplate: (template: ProposalTemplate | null) => void;
  clearError: () => void;
}

export const useProposalTemplatesStore = create<ProposalTemplatesState>((set, get) => ({
  templates: [],
  archivedTemplates: [],
  loading: false,
  error: null,
  searchQuery: '',
  filterActive: null,
  selectedTemplate: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const { items } = await proposalTemplatesApi.getProposalTemplates({
        search: get().searchQuery || undefined,
        isActive: get().filterActive ?? undefined,
      });
      set({ templates: items, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablonlar yüklenirken hata oluştu',
        loading: false
      });
    }
  },

  fetchArchivedTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const archivedTemplates = await proposalTemplatesApi.getArchivedProposalTemplates();
      set({ archivedTemplates, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Arşivlenen şablonlar yüklenirken hata oluştu',
        loading: false
      });
    }
  },

  createTemplate: async (data: CreateProposalTemplateDto) => {
    set({ loading: true, error: null });
    try {
      await proposalTemplatesApi.createProposalTemplate(data);
      await get().fetchTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon oluşturulurken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateProposalTemplateDto) => {
    set({ loading: true, error: null });
    try {
      await proposalTemplatesApi.updateProposalTemplate(id, data);
      await get().fetchTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await proposalTemplatesApi.deleteProposalTemplate(id);
      await get().fetchTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon silinirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  restoreTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await proposalTemplatesApi.restoreProposalTemplate(id);
      await get().fetchTemplates();
      await get().fetchArchivedTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon geri yüklenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  toggleActive: async (id: string, isActive: boolean) => {
    set({ loading: true, error: null });
    try {
      await proposalTemplatesApi.toggleActive(id, isActive);
      await get().fetchTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon durumu güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().fetchTemplates();
  },

  setFilterActive: (filter: boolean | null) => {
    set({ filterActive: filter });
    get().fetchTemplates();
  },

  setSelectedTemplate: (template: ProposalTemplate | null) => {
    set({ selectedTemplate: template });
  },

  clearError: () => set({ error: null }),
}));
