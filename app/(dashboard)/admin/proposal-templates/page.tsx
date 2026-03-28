'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageProposalTemplates } from '@/lib/utils/permissions';
import { useProposalTemplatesStore } from '@/lib/stores/proposal-templates';
import { ProposalTemplatesList } from '@/components/admin/proposals/ProposalTemplatesList';
import { ProposalForm } from '@/components/admin/proposals/ProposalForm';
import { ProposalTemplate, CreateProposalTemplateDto, UpdateProposalTemplateDto } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminProposalTemplatesPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const {
    templates,
    archivedTemplates,
    loading,
    error,
    fetchTemplates,
    fetchArchivedTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    restoreTemplate,
    toggleActive,
    clearError,
  } = useProposalTemplatesStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (user && !hasFetched.current) {
      console.log('[ProposalTemplatesPage] Fetching templates...');
      fetchTemplates();
      fetchArchivedTemplates();
      hasFetched.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Check permissions
  if (!canManageProposalTemplates(user.role)) {
    router.push('/dashboard');
    return null;
  }

  const handleEdit = (template: ProposalTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleSave = async (data: CreateProposalTemplateDto | UpdateProposalTemplateDto) => {
    clearError();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
        toast.success('Şablon güncellendi');
      } else {
        await createTemplate(data as CreateProposalTemplateDto);
        toast.success('Şablon oluşturuldu');
      }
      setFormOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    clearError();
    try {
      await deleteTemplate(id);
      toast.success('Şablon arşivlendi');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleRestore = async (id: string) => {
    clearError();
    try {
      await restoreTemplate(id);
      toast.success('Şablon geri yüklendi');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    clearError();
    try {
      await toggleActive(id, isActive);
      toast.success(isActive ? 'Şablon aktif edildi' : 'Şablon pasife alındı');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const activeTemplateCount = templates.filter((t) => t.is_active).length;
  const inactiveTemplateCount = templates.filter((t) => !t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teklif Şablonları</h1>
          <p className="text-muted-foreground mt-1">
            Leadlere gönderilecek teklif şablonlarını yönetin
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Şablon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Şablon</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktif Şablon</p>
              <p className="text-2xl font-bold">{activeTemplateCount}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pasif Şablon</p>
              <p className="text-2xl font-bold">{inactiveTemplateCount}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <ProposalTemplatesList
        templates={templates}
        archivedTemplates={archivedTemplates}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onToggleActive={handleToggleActive}
      />

      {/* Template Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Mevcut teklif şablonunu düzenleyin'
                : 'Yeni bir teklif şablonu oluşturun'}
            </DialogDescription>
          </DialogHeader>
          <ProposalForm
            template={editingTemplate || undefined}
            onSave={handleSave}
            onCancel={() => {
              setFormOpen(false);
              setEditingTemplate(null);
            }}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
