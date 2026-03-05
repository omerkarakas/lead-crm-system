import { create } from 'zustand';
import { Setting, CreateSettingDto, UpdateSettingDto, ServiceName } from '@/types/setting';

interface SettingsState {
  settings: Setting[];
  loading: boolean;
  error: string | null;
  testResults: Record<string, { success: boolean; message: string; timestamp?: number }>;
  fetchSettings: () => Promise<void>;
  updateSetting: (id: string, data: UpdateSettingDto) => Promise<void>;
  createSetting: (data: CreateSettingDto) => Promise<void>;
  testConnection: (service: ServiceName) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: [],
  loading: false,
  error: null,
  testResults: {},

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Ayarlar yüklenirken hata oluştu');
      }
      const data = await response.json();
      set({ settings: data.items || [], loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ayarlar yüklenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  updateSetting: async (id: string, data: UpdateSettingDto) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ayar güncellenirken hata oluştu');
      }

      await get().fetchSettings();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ayar güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  createSetting: async (data: CreateSettingDto) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ayar oluşturulurken hata oluştu');
      }

      await get().fetchSettings();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Ayar oluşturulurken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  testConnection: async (service: ServiceName, message?: string) => {
    set({ loading: true, error: null });
    try {
      // Use special endpoint for proposal notifications
      const endpoint = service === 'proposal_notifications'
        ? '/api/settings/test/proposal-notification'
        : `/api/settings/test/${service}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: message ? { 'Content-Type': 'application/json' } : undefined,
        body: message ? JSON.stringify({ message }) : undefined,
      });

      if (!response.ok) {
        throw new Error('Bağlantı testi başarısız');
      }

      const result = await response.json();

      set({
        testResults: {
          ...get().testResults,
          [service]: {
            success: result.success,
            message: result.message,
            timestamp: Date.now(),
          },
        },
        loading: false,
      });

      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error: any) {
      set({
        testResults: {
          ...get().testResults,
          [service]: {
            success: false,
            message: error.message || 'Bağlantı testi başarısız',
            timestamp: Date.now(),
          },
        },
        loading: false,
        error: error.message || 'Bağlantı testi başarısız',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper hooks for service-specific settings
export const useServiceSettings = (serviceName: ServiceName) => {
  const allSettings = useSettingsStore((state) => state.settings);
  return allSettings.filter((s) => s.service_name === serviceName);
};

export const useSettingValue = (serviceName: ServiceName, key: string) => {
  const allSettings = useSettingsStore((state) => state.settings);
  return allSettings.find(
    (s) => s.service_name === serviceName && s.setting_key === key
  );
};
