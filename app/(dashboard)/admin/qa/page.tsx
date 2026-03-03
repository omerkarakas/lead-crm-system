'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageQAQuestions } from '@/lib/utils/permissions';
import { useQAStore } from '@/lib/stores/qa';
import { QuestionBuilder } from '@/components/admin/qa/QuestionBuilder';
import { QuestionList } from '@/components/admin/qa/QuestionList';
import { WelcomeMessageConfig, DEFAULT_WELCOME_MESSAGE, POLL_FOOTER } from '@/components/admin/qa/WelcomeMessageConfig';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QAQuestion } from '@/types/qa';

export default function AdminQAPage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const { questions, loading, error, fetchQuestions, createQuestion, updateQuestion, deleteQuestion, toggleQuestionActive, reorderQuestions, clearError } = useQAStore();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QAQuestion | null>(null);
  const [welcomeConfigOpen, setWelcomeConfigOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME_MESSAGE);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user, fetchQuestions]);

  useEffect(() => {
    // Load welcome message from localStorage
    const saved = localStorage.getItem('qa_welcome_message');
    if (saved) {
      setWelcomeMessage(saved);
    }
  }, []);

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
  if (!canManageQAQuestions(user.role)) {
    router.push('/leads');
    return null;
  }

  const handleEdit = (question: QAQuestion) => {
    setEditingQuestion(question);
    setBuilderOpen(true);
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setBuilderOpen(true);
  };

  const handleSave = async (data: any) => {
    clearError();
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, data);
        toast.success('Soru güncellendi');
      } else {
        await createQuestion(data);
        toast.success('Soru oluşturuldu');
      }
      setBuilderOpen(false);
      setEditingQuestion(null);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    clearError();
    try {
      await deleteQuestion(id);
      toast.success('Soru silindi');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    clearError();
    try {
      await toggleQuestionActive(id, isActive);
      toast.success(isActive ? 'Soru aktif edildi' : 'Soru pasife alındı');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleReorder = async (reorderedQuestions: QAQuestion[]) => {
    clearError();
    try {
      await reorderQuestions(reorderedQuestions);
      toast.success('Sorular yeniden sıralandı');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleSaveWelcomeMessage = async (message: string) => {
    try {
      localStorage.setItem('qa_welcome_message', message);
      setWelcomeMessage(message);
      toast.success('Karşılama mesajı kaydedildi');
    } catch (error: any) {
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nitelik Soruları</h1>
          <p className="text-muted-foreground mt-1">
            Lead'lere gönderilecek WhatsApp sorularını yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWelcomeConfigOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Mesaj Ayarları
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Soru
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Soru</p>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktif Soru</p>
              <p className="text-2xl font-bold">
                {questions.filter((q) => q.is_active).length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pasif Soru</p>
              <p className="text-2xl font-bold">
                {questions.filter((q) => !q.is_active).length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <QuestionList
        questions={questions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
      />

      {/* Question Builder Dialog */}
      <QuestionBuilder
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSave}
        editingQuestion={editingQuestion}
      />

      {/* Welcome Message Config Dialog */}
      <WelcomeMessageConfig
        open={welcomeConfigOpen}
        onClose={() => setWelcomeConfigOpen(false)}
        onSave={handleSaveWelcomeMessage}
        currentMessage={welcomeMessage}
      />
    </div>
  );
}
