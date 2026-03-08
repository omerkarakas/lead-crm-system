'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { CampaignEnrollment } from '@/types/campaign';

interface UnsubscribeFormProps {
  token: string;
  activeEnrollments: CampaignEnrollment[];
  leadName: string;
}

/**
 * Form for unsubscribing from campaigns
 * Allows selection of specific campaigns or all campaigns
 */
export function UnsubscribeForm({ token, activeEnrollments, leadName }: UnsubscribeFormProps) {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(
    activeEnrollments.map((e) => e.campaign_id)
  );
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggleCampaign = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleToggleAll = () => {
    if (selectedCampaigns.length === activeEnrollments.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(activeEnrollments.map((e) => e.campaign_id));
    }
  };

  const handleUnsubscribeSelected = async () => {
    if (selectedCampaigns.length === 0) {
      return;
    }

    try {
      setUnsubscribing(true);
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          campaign_ids: selectedCampaigns,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unsubscribe');
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('[UnsubscribeForm] Error:', error);
      alert('Hata: ' + (error.message || 'İşlem başarısız'));
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    try {
      setUnsubscribing(true);
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unsubscribe');
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('[UnsubscribeForm] Error:', error);
      alert('Hata: ' + (error.message || 'İşlem başarısız'));
    } finally {
      setUnsubscribing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Başarılı!
        </h2>
        <p className="text-gray-600">
          Seçtiğiniz kamyalardan ayrıldınız. Artık bu kamyalardan e-posta almayacaksınız.
        </p>
      </div>
    );
  }

  if (activeEnrollments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {leadName} şu anda hiçbir aktif kampanyaya kayıtlı değil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selectedCampaigns.length === activeEnrollments.length}
            onCheckedChange={handleToggleAll}
          />
          <span className="font-medium">Tümünü Seç</span>
        </label>
        <span className="text-sm text-gray-500">
          {selectedCampaigns.length} / {activeEnrollments.length} seçili
        </span>
      </div>

      <div className="space-y-3">
        {activeEnrollments.map((enrollment) => {
          const campaign = enrollment.expand?.campaign_id;
          const isSelected = selectedCampaigns.includes(enrollment.campaign_id);

          return (
            <Card
              key={enrollment.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggleCampaign(enrollment.campaign_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCampaign(enrollment.campaign_id)}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {campaign?.name || 'Kampanya'}
                    </h3>
                    {campaign?.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleUnsubscribeAll}
          disabled={unsubscribing}
        >
          {unsubscribing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Tüm Kamyalardan Ayrıl
        </Button>
        <Button
          className="flex-1"
          onClick={handleUnsubscribeSelected}
          disabled={selectedCampaigns.length === 0 || unsubscribing}
        >
          {unsubscribing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Seçili Kamyalardan Ayrıl
        </Button>
      </div>
    </div>
  );
}
