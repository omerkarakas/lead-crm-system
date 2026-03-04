import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EmailState {
  lastUsedTemplateId: string | null;
  setLastUsedTemplate: (templateId: string) => void;
  clearLastUsedTemplate: () => void;
}

export const useEmailStore = create<EmailState>()(
  persist(
    (set) => ({
      lastUsedTemplateId: null,
      setLastUsedTemplate: (templateId) => set({ lastUsedTemplateId: templateId }),
      clearLastUsedTemplate: () => set({ lastUsedTemplateId: null }),
    }),
    {
      name: 'email-storage',
    }
  )
);
