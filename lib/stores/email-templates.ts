import { create } from 'zustand';
import { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email';

type ViewMode = 'table' | 'card';

interface EmailTemplatesState {
  templates: EmailTemplate[];
  archivedTemplates: EmailTemplate[];
  categories: string[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  fetchTemplates: () => Promise<void>;
  fetchArchivedTemplates: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createTemplate: (data: CreateEmailTemplateDto) => Promise<void>;
  updateTemplate: (id: string, data: UpdateEmailTemplateDto) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;
  restoreTemplate: (id: string) => Promise<void>;
  toggleTemplateActive: (id: string, isActive: boolean) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
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

export const useEmailTemplatesStore = create<EmailTemplatesState>((set, get) => ({
  templates: [],
  archivedTemplates: [],
  categories: [],
  loading: false,
  error: null,
  viewMode: 'table',

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const templates = await fetchFromAPI('/api/email-templates');
      set({ templates, loading: false });
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
      const archivedTemplates = await fetchFromAPI('/api/email-templates?archived=true');
      set({ archivedTemplates, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Arşivlenen şablonlar yüklenirken hata oluştu',
        loading: false
      });
    }
  },

  fetchCategories: async () => {
    try {
      // Extract categories from templates
      const templates = get().templates;
      const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
      set({ categories });
    } catch (error: any) {
      set({ error: error.message || 'Kategoriler yüklenirken hata oluştu' });
    }
  },

  createTemplate: async (data: CreateEmailTemplateDto) => {
    set({ loading: true, error: null });
    try {
      await fetchFromAPI('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await get().fetchTemplates();
      await get().fetchCategories();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon oluşturulurken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateEmailTemplateDto) => {
    set({ loading: true, error: null });
    try {
      await fetchFromAPI(`/api/email-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await get().fetchTemplates();
      await get().fetchCategories();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  archiveTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await fetchFromAPI(`/api/email-templates/${id}`, {
        method: 'DELETE',
      });
      await get().fetchTemplates();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Şablon arşivenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  restoreTemplate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await fetchFromAPI(`/api/email-templates/${id}/restore`, {
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

  toggleTemplateActive: async (id: string, isActive: boolean) => {
    set({ loading: true, error: null });
    try {
      await fetchFromAPI(`/api/email-templates/${id}/toggle`, {
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

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  clearError: () => set({ error: null }),
}));
