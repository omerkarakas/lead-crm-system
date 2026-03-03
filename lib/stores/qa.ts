import { create } from 'zustand';
import { QAQuestion, CreateQAQuestionDto, UpdateQAQuestionDto } from '@/types/qa';
import * as qaApi from '@/lib/api/qa';

interface QAState {
  questions: QAQuestion[];
  loading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
  fetchActiveQuestions: () => Promise<QAQuestion[]>;
  createQuestion: (data: CreateQAQuestionDto) => Promise<void>;
  updateQuestion: (id: string, data: UpdateQAQuestionDto) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  toggleQuestionActive: (id: string, isActive: boolean) => Promise<void>;
  reorderQuestions: (questions: QAQuestion[]) => Promise<void>;
  clearError: () => void;
}

export const useQAStore = create<QAState>((set, get) => ({
  questions: [],
  loading: false,
  error: null,

  fetchQuestions: async () => {
    set({ loading: true, error: null });
    try {
      const questions = await qaApi.fetchQuestions();
      set({ questions, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Sorular yüklenirken hata oluştu',
        loading: false
      });
    }
  },

  fetchActiveQuestions: async () => {
    try {
      return await qaApi.fetchActiveQuestions();
    } catch (error: any) {
      set({ error: error.message || 'Aktif sorular yüklenirken hata oluştu' });
      return [];
    }
  },

  createQuestion: async (data: CreateQAQuestionDto) => {
    set({ loading: true, error: null });
    try {
      await qaApi.createQuestion(data);
      await get().fetchQuestions();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Soru oluşturulurken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  updateQuestion: async (id: string, data: UpdateQAQuestionDto) => {
    set({ loading: true, error: null });
    try {
      await qaApi.updateQuestion(id, data);
      await get().fetchQuestions();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Soru güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  deleteQuestion: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await qaApi.deleteQuestion(id);
      await get().fetchQuestions();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Soru silinirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  toggleQuestionActive: async (id: string, isActive: boolean) => {
    set({ loading: true, error: null });
    try {
      await qaApi.toggleQuestionActive(id, isActive);
      await get().fetchQuestions();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Soru durumu güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  reorderQuestions: async (questions: QAQuestion[]) => {
    set({ loading: true, error: null });
    try {
      await qaApi.reorderQuestions(questions);
      await get().fetchQuestions();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Sorular yeniden sıralanırken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
