import { create } from 'zustand';
import { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email';
import * as emailTemplatesApi from '@/lib/api/email-templates';

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
      const templates = await emailTemplatesApi.fetchTemplates();
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
      const archivedTemplates = await emailTemplatesApi.fetchArchivedTemplates();
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
      const categories = await emailTemplatesApi.fetchCategories();
      set({ categories });
    } catch (error: any) {
      set({ error: error.message || 'Kategoriler yüklenirken hata oluştu' });
    }
  },

  createTemplate: async (data: CreateEmailTemplateDto) => {
    set({ loading: true, error: null });
    try {
      await emailTemplatesApi.createTemplate(data);
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
      await emailTemplatesApi.updateTemplate(id, data);
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
      await emailTemplatesApi.archiveTemplate(id);
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
      await emailTemplatesApi.restoreTemplate(id);
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
      await emailTemplatesApi.toggleTemplateActive(id, isActive);
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
