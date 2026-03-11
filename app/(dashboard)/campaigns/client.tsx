'use client';

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Campaign } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Plus, Megaphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCampaignsStore } from '@/lib/stores/campaigns';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { toast } from 'sonner';
import { CreateCampaignDto, UpdateCampaignDto } from '@/types/campaign';
import type { SequenceStep } from '@/types/campaign';
import * as campaignApi from '@/lib/api/campaigns';

export function CampaignsClient() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>();
  const { campaigns, loading, error, fetchCampaigns, createCampaign, updateCampaign, deleteCampaign } =
    useCampaignsStore();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = () => {
    setEditingCampaign(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setDialogOpen(true);
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`"${campaign.name}" kampanyasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteCampaign(campaign.id);
      toast.success('Kampanya silindi');
    } catch (error: any) {
      toast.error(error.message || 'Kampanya silinirken hata oluştu');
    }
  };

  const handleViewSequences = (campaign: Campaign) => {
    router.push(`/campaigns/${campaign.id}/sequences`);
  };

  const handleSave = async (data: CreateCampaignDto | UpdateCampaignDto, sequenceData?: { name: string; steps: SequenceStep[] }) => {
    try {
      let campaignId: string;

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, data);
        campaignId = editingCampaign.id;
        toast.success('Kampanya güncellendi');
      } else {
        const newCampaign = await createCampaign(data as CreateCampaignDto);
        campaignId = newCampaign.id;
        toast.success('Kampanya oluşturuldu');
      }

      // Create sequence if data provided
      if (sequenceData && sequenceData.steps.length > 0) {
        try {
          if (!sequenceData.name || sequenceData.name.trim() === '') {
            throw new Error('Sequence name is required');
          }

          const response = await fetch('/api/sequences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: campaignId,
              name: sequenceData.name,
              steps: sequenceData.steps,
              is_active: true,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create sequence');
          }

          toast.success('Sıra oluşturuldu');
        } catch (sequenceError: any) {
          console.error('Failed to create sequence:', sequenceError);
          toast.error(sequenceError.message || 'Sıra oluşturulamadı');
        }
      }

      setDialogOpen(false);
      setEditingCampaign(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
      throw error;
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCampaign(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanyalar</h1>
          <p className="text-muted-foreground">
            Çok kanallı besleme kampanyalarını yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      ) : (
        <CampaignList
          campaigns={campaigns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewSequences={handleViewSequences}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? 'Mevcut kampanyayı düzenleyin'
                : 'Yeni çok kanallı besleme kampanyası oluşturun'}
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            campaign={editingCampaign}
            onSave={handleSave}
            onCancel={handleDialogClose}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
