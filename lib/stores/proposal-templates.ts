import { create } from 'zustand';
import { ProposalTemplate, CreateProposalTemplateDto, UpdateProposalTemplateDto } from '@/types/proposal';

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

// Helper function to fetch from API
async function fetchFromAPI(endpoint: string, options?: RequestInit): Promise<any> {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'API request failed');
  }
  return response.json();
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
      const items = await fetchFromAPI('/api/proposal-templates');
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
      const archivedTemplates = await fetchFromAPI('/api/proposal-templates?archived=true');
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
      await fetchFromAPI('/api/proposal-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
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
      await fetchFromAPI(`/api/proposal-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
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
      await fetchFromAPI(`/api/proposal-templates/${id}`, {
        method: 'DELETE',
      });
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
      await fetchFromAPI(`/api/proposal-templates/${id}/restore`, {
        method: 'POST',
      });
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
      await fetchFromAPI(`/api/proposal-templates/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
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
