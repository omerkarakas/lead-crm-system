'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
import { useLeadsStore } from '@/lib/stores/leads';
import { toast } from 'sonner';
import { LeadModal } from './LeadModal';

interface LeadDetailActionsProps {
  leadId: string;
  leadName: string;
  lead: any; // Full lead object for editing
}

export function LeadDetailActions({ leadId, leadName, lead }: LeadDetailActionsProps) {
  const router = useRouter();
  const { deleteLead } = useLeadsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteLead(leadId);
      toast.success(`${leadName} silindi`);
      router.push('/leads');
    } catch (error: any) {
      toast.error(error.message || 'Lead silinirken hata oluştu');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Düzenle
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Sil
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lead Silmek İstediğinizden Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{leadName}</strong> adlı leadi silmek üzeresiniz. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LeadModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        lead={lead}
        mode="edit"
      />
    </>
  );
}
