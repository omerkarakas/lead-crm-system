'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { SequenceBuilder } from '@/components/campaigns/SequenceBuilder';
import type { Campaign, Sequence } from '@/types/campaign';
import * as campaignApi from '@/lib/api/campaigns';

interface SequencesPageClientProps {
  campaign: Campaign;
  sequences: Sequence[];
  editingSequenceId?: string;
  isNewSequence?: boolean;
}

export function SequencesPageClient({
  campaign,
  sequences: initialSequences,
  editingSequenceId,
  isNewSequence,
}: SequencesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sequences, setSequences] = useState<Sequence[]>(initialSequences || []);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sequenceToDelete, setSequenceToDelete] = useState<Sequence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('[SequencesPageClient] Initial sequences:', initialSequences);

  // Determine which sequence to edit
  const activeSequence = editingSequenceId
    ? sequences.find(s => s.id === editingSequenceId)
    : isNewSequence
    ? null
    : undefined;

  useEffect(() => {
    // Reload sequences when returning to list view
    if (!editingSequenceId && !isNewSequence) {
      loadSequences();
    }
  }, [searchParams]);

  const loadSequences = async () => {
    try {
      const response = await fetch(`/api/sequences?campaign_id=${campaign.id}`);
      if (!response.ok) {
        throw new Error('Failed to load sequences');
      }
      const data = await response.json();
      setSequences(data.items || []);
    } catch (error) {
      console.error('Failed to load sequences:', error);
      toast.error('Sıralar yüklenirken hata oluştu');
    }
  };

  const handleCreateNew = () => {
    router.push(`/campaigns/${campaign.id}/sequences?new=true`);
  };

  const handleEdit = (sequence: Sequence) => {
    router.push(`/campaigns/${campaign.id}/sequences?edit=${sequence.id}`);
  };

  const handleDeleteClick = (sequence: Sequence) => {
    setSequenceToDelete(sequence);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sequenceToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sequences/${sequenceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sequence');
      }

      toast.success('Sıra silindi');
      setSequences(sequences.filter(s => s.id !== sequenceToDelete.id));
      setDeleteDialogOpen(false);
      setSequenceToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Sıra silinirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSequenceSaved = (sequenceId: string) => {
    toast.success('Sıra kaydedildi');
    loadSequences();
    // Return to list view
    router.push(`/campaigns/${campaign.id}/sequences`);
  };

  const handleSequenceCancelled = () => {
    // Return to list view
    router.push(`/campaigns/${campaign.id}/sequences`);
  };

  const handleBackToCampaigns = () => {
    router.push('/campaigns');
  };

  const getStepCountLabel = (steps: any[]) => {
    return `${steps.length} adım`;
  };

  // Show builder if editing or creating new
  if (editingSequenceId || isNewSequence) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleSequenceCancelled}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {editingSequenceId ? 'Sıra Düzenle' : 'Yeni Sıra Oluştur'}
              </h1>
              <p className="text-muted-foreground">
                {campaign.name} kampanyası için {editingSequenceId ? 'sıra düzenleme' : 'yeni sıra oluşturma'}
              </p>
            </div>
          </div>
        </div>

        {/* Sequence Builder */}
        <SequenceBuilder
          campaignId={campaign.id}
          sequenceId={editingSequenceId}
          sequence={activeSequence || undefined}
          onSequenceSaved={handleSequenceSaved}
          onSequenceCancelled={handleSequenceCancelled}
        />
      </div>
    );
  }

  // Show list of sequences
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={handleBackToCampaigns}>
          Kampanyalar
        </Button>
        <span>/</span>
        <span>{campaign.name}</span>
        <span>/</span>
        <span className="text-foreground">Sıralar</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <p className="text-muted-foreground">
                {sequences.length} sıra
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sıra
        </Button>
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz sıra yok</h3>
            <p className="text-muted-foreground text-center mb-6">
              Bu kampanya için besleme sırası oluşturun
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Sırayı Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getStepCountLabel(sequence.steps)}
                    </CardDescription>
                  </div>
                  <Badge variant={sequence.is_active ? 'default' : 'secondary'}>
                    {sequence.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {sequence.steps.map((step, index) => {
                      const typeLabel = step.type === 'email' ? 'Email' :
                                       step.type === 'whatsapp' ? 'WhatsApp' :
                                       step.type === 'delay' ? 'Gecikme' : step.type;
                      return (
                        <span key={step.id} className="inline-block mr-2">
                          {index + 1}. {typeLabel}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="pt-6">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(sequence)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(sequence)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sırayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{sequenceToDelete?.name}" sırasını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
