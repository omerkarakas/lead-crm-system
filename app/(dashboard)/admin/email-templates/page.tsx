'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageEmailTemplates } from '@/lib/utils/permissions';
import { useEmailTemplatesStore } from '@/lib/stores/email-templates';
import { TemplateList } from '@/components/admin/email/TemplateList';
import { TemplateForm } from '@/components/admin/email/TemplateForm';
import { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminEmailTemplatesPage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const {
    templates,
    archivedTemplates,
    categories,
    loading,
    error,
    viewMode,
    fetchTemplates,
    fetchArchivedTemplates,
    fetchCategories,
    createTemplate,
    updateTemplate,
    archiveTemplate,
    restoreTemplate,
    toggleTemplateActive,
    setViewMode,
    clearError,
  } = useEmailTemplatesStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchCategories();
      fetchArchivedTemplates();
    }
  }, [user, fetchTemplates, fetchCategories, fetchArchivedTemplates]);

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
  if (!canManageEmailTemplates(user.role)) {
    router.push('/leads');
    return null;
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleSave = async (data: CreateEmailTemplateDto | UpdateEmailTemplateDto) => {
    clearError();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
        toast.success('Şablon güncellendi');
      } else {
        await createTemplate(data as CreateEmailTemplateDto);
        toast.success('Şablon oluşturuldu');
      }
      setFormOpen(false);
      setEditingTemplate(null);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleArchive = async (id: string) => {
    clearError();
    try {
      await archiveTemplate(id);
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
      await toggleTemplateActive(id, isActive);
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
          <h1 className="text-3xl font-bold">E-posta Şablonları</h1>
          <p className="text-muted-foreground mt-1">
            Leadlere gönderilecek e-posta şablonlarını yönetin
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
            <Mail className="h-8 w-8 text-muted-foreground" />
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
      <TemplateList
        templates={templates}
        archivedTemplates={archivedTemplates}
        categories={categories}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEdit={handleEdit}
        onArchive={handleArchive}
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
                ? 'Mevcut e-posta şablonunu düzenleyin'
                : 'Yeni bir e-posta şablonu oluşturun'}
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={editingTemplate || undefined}
            categories={categories}
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
