import { create } from 'zustand';
import { Lead, CreateLeadDto, UpdateLeadDto, LeadsListParams, LeadStatus } from '@/types/lead';
import * as leadsApi from '@/lib/api/leads';

interface LeadsState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
  };
  filters: {
    search: string;
    status?: LeadStatus;
    tags?: string[];
  };

  fetchLeads: (params?: LeadsListParams) => Promise<void>;
  fetchLead: (id: string) => Promise<Lead>;
  createLead: (data: CreateLeadDto) => Promise<Lead>;
  updateLead: (id: string, data: UpdateLeadDto, options?: { force?: boolean; userRole?: 'admin' | 'sales' | 'marketing' }) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  setFilters: (filters: Partial<LeadsState['filters']>) => void;
  clearError: () => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    perPage: 50,
    totalPages: 1,
    totalItems: 0,
  },
  filters: {
    search: '',
    status: undefined,
    tags: undefined,
  },

  fetchLeads: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await leadsApi.fetchLeads({
        ...get().filters,
        ...params,
      });

      set({
        leads: response.items,
        pagination: {
          page: response.page,
          perPage: response.perPage,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
        },
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Leadler yüklenirken hata oluştu',
        loading: false
      });
    }
  },

  fetchLead: async (id: string) => {
    return await leadsApi.fetchLead(id);
  },

  createLead: async (data: CreateLeadDto) => {
    set({ loading: true, error: null });
    try {
      const createdLead = await leadsApi.createLead(data);
      await get().fetchLeads();
      set({ loading: false });
      return createdLead;
    } catch (error: any) {
      set({
        error: error.message || 'Lead oluşturulurken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  updateLead: async (id: string, data: UpdateLeadDto, options?: { force?: boolean; userRole?: 'admin' | 'sales' | 'marketing' }) => {
    set({ loading: true, error: null });
    try {
      await leadsApi.updateLead(id, data, options);
      await get().fetchLeads();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Lead güncellenirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  deleteLead: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await leadsApi.deleteLead(id);
      await get().fetchLeads();
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Lead silinirken hata oluştu',
        loading: false
      });
      throw error;
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  clearError: () => set({ error: null }),
}));
