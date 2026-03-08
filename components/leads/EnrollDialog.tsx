'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/types/campaign';
import { CampaignType } from '@/types/campaign';

interface EnrollDialogProps {
  leadId: string;
  onEnroll?: () => void;
}

/**
 * Dialog for enrolling lead in a campaign
 */
export function EnrollDialog({ leadId, onEnroll }: EnrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailableCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.items || []);
    } catch (error) {
      console.error('[EnrollDialog] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Kampanyalar yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCampaign) return;

    try {
      setEnrolling(true);
      const response = await fetch(`/api/leads/${leadId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: selectedCampaign }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enroll');
      }

      toast({
        title: 'Başarılı',
        description: 'Lead kampanyaya eklendi',
      });

      setOpen(false);
      onEnroll?.();
    } catch (error: any) {
      console.error('[EnrollDialog] Error:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Kampanyaya eklenirken hata oluştu',
      });
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableCampaigns();
    }
  }, [open]);

  const getCampaignTypeLabel = (type: CampaignType) => {
    return type === CampaignType.Email ? 'E-posta' : 'WhatsApp';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Kampanyaya Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kampanyaya Ekle</DialogTitle>
          <DialogDescription>
            Bu lead'i bir nurturing kampanyasına ekleyin
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aktif kampanya bulunmuyor
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCampaign === campaign.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCampaign(campaign.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {getCampaignTypeLabel(campaign.type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.description}
                    </p>
                    {campaign.auto_enroll_min_score !== undefined && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Min. Skor: {campaign.auto_enroll_min_score}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={enrolling}
          >
            İptal
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedCampaign || enrolling}
          >
            {enrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
