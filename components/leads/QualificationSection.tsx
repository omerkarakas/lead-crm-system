'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LeadQuality } from '@/types/lead';
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
import { useAuthStore } from '@/lib/stores/auth';
import { Role } from '@/types/auth';
import { toast } from 'sonner';
import { RefreshCw, Loader2, RotateCcw } from 'lucide-react';
import { ScoreDisplay } from './ScoreDisplay';

interface QualificationSectionProps {
  leadId: string;
  leadName: string;
  totalScore: number;
  quality: string;
  scoreBreakdown: Array<{
    questionNumber: number;
    questionText: string;
    selectedOption: string;
    selectedOptionText: string;
    points: number;
  }>;
  qaCompleted: boolean;
  qaSentAt: string | null;
  qaCompletedAt: string | null;
}

export function QualificationSection({
  leadId,
  leadName,
  totalScore,
  quality,
  scoreBreakdown,
  qaCompleted,
  qaSentAt,
  qaCompletedAt,
}: QualificationSectionProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetQualification = async () => {
    try {
      setIsResetting(true);
      const response = await fetch(`/api/leads/${leadId}/reset-qualification`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Qualification reset failed');
      }

      toast.success('Qualification sıfırlandı ve anket yeniden gönderildi.');
      setShowResetDialog(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'İşlem başarısız');
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Qualification Sonucu</h2>
        {user?.role === Role.ADMIN && (qaCompleted || quality === 'pending') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetDialog(true)}
            className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 group"
          >
            <RotateCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Yeniden Sor
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ScoreDisplay
          totalScore={totalScore}
          quality={quality as LeadQuality}
          breakdown={scoreBreakdown}
          qaCompleted={qaCompleted}
        />

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Durum</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${qaCompleted ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-xs text-gray-500">
                {qaCompleted ? 'Tamamlandı' : 'Beklemede'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="group">
              <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-600 font-medium">Poll Gönderildi</span>
                <span className="text-gray-900 font-mono text-xs">
                  {formatDate(qaSentAt)}
                </span>
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <span className="text-gray-600 font-medium">Cevaplandı</span>
                <span className={`font-mono text-xs ${qaCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formatDate(qaCompletedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Qualification Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <AlertDialogTitle>Qualification Yeniden Başlatılacak</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pl-13">
              <strong className="text-gray-900">{leadName}</strong> için:
              <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Tüm QA cevapları silinecek</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Skor ve kalite puanı sıfırlanacak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>WhatsApp anketi yeniden gönderilecek</span>
                </li>
              </ul>
              <p className="mt-4 text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting} className="mt-2">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleResetQualification();
              }}
              disabled={isResetting}
              className="bg-amber-600 text-white hover:bg-amber-700 mt-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                'Evet, Yeniden Sor'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
