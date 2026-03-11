import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Campaign,
  Sequence,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateSequenceDto,
  UpdateSequenceDto,
  SegmentPreview,
  AudienceSegment,
} from '@/types/campaign';

interface CampaignsState {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  sequences: Sequence[];
  isPreviewOpen: boolean;
  previewData: SegmentPreview | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  createCampaign: (data: CreateCampaignDto) => Promise<Campaign>;
  updateCampaign: (id: string, data: UpdateCampaignDto) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  setActiveCampaign: (campaign: Campaign | null) => void;

  // Sequences
  fetchSequences: (campaignId: string) => Promise<void>;
  createSequence: (data: CreateSequenceDto) => Promise<void>;
  updateSequence: (id: string, data: UpdateSequenceDto) => Promise<void>;
  deleteSequence: (id: string) => Promise<void>;

  // Preview
  showPreview: (segment: AudienceSegment) => Promise<void>;
  hidePreview: () => void;

  // Utilities
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

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      activeCampaign: null,
      sequences: [],
      isPreviewOpen: false,
      previewData: null,
      loading: false,
      error: null,

      fetchCampaigns: async () => {
        set({ loading: true, error: null });
        try {
          const data = await fetchFromAPI('/api/campaigns');
          set({ campaigns: data.items || [], loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Kampanyalar yüklenirken hata oluştu',
            loading: false
          });
        }
      },

      fetchCampaign: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const campaign = await fetchFromAPI(`/api/campaigns/${id}`);
          set({ activeCampaign: campaign, sequences: campaign.sequences || [], loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Kampanya yüklenirken hata oluştu',
            loading: false
          });
        }
      },

      createCampaign: async (data: CreateCampaignDto) => {
        set({ loading: true, error: null });
        try {
          const campaign = await fetchFromAPI('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          await get().fetchCampaigns();
          set({ loading: false });
          return campaign;
        } catch (error: any) {
          set({
            error: error.message || 'Kampanya oluşturulurken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      updateCampaign: async (id: string, data: UpdateCampaignDto) => {
        set({ loading: true, error: null });
        try {
          await fetchFromAPI(`/api/campaigns/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          await get().fetchCampaigns();
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Kampanya güncellenirken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      deleteCampaign: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await fetchFromAPI(`/api/campaigns/${id}`, {
            method: 'DELETE',
          });
          await get().fetchCampaigns();
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Kampanya silinirken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      setActiveCampaign: (campaign: Campaign | null) => {
        set({ activeCampaign: campaign });
      },

      fetchSequences: async (campaignId: string) => {
        set({ loading: true, error: null });
        try {
          const sequences = await fetchFromAPI(`/api/campaigns/${campaignId}/sequences`);
          set({ sequences, loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Sıralar yüklenirken hata oluştu',
            loading: false
          });
        }
      },

      createSequence: async (data: CreateSequenceDto) => {
        set({ loading: true, error: null });
        try {
          await fetchFromAPI('/api/sequences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const activeCampaign = get().activeCampaign;
          if (activeCampaign) {
            await get().fetchCampaign(activeCampaign.id);
          }
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Sıra oluşturulurken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      updateSequence: async (id: string, data: UpdateSequenceDto) => {
        set({ loading: true, error: null });
        try {
          await fetchFromAPI(`/api/sequences/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const activeCampaign = get().activeCampaign;
          if (activeCampaign) {
            await get().fetchCampaign(activeCampaign.id);
          }
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Sıra güncellenirken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      deleteSequence: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await fetchFromAPI(`/api/sequences/${id}`, {
            method: 'DELETE',
          });
          const activeCampaign = get().activeCampaign;
          if (activeCampaign) {
            await get().fetchCampaign(activeCampaign.id);
          }
          set({ loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Sıra silinirken hata oluştu',
            loading: false
          });
          throw error;
        }
      },

      showPreview: async (segment: AudienceSegment) => {
        set({ loading: true, error: null });
        try {
          const previewData = await fetchFromAPI('/api/campaigns/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(segment),
          });
          set({ previewData, isPreviewOpen: true, loading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Segment önizleme hatası',
            loading: false
          });
        }
      },

      hidePreview: () => {
        set({ isPreviewOpen: false, previewData: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'campaigns-storage',
      partialize: (state) => ({
        campaigns: state.campaigns,
      }),
    }
  )
);
