import { fetchLead } from '@/lib/api/leads';
import { getLeadAnswers } from '@/lib/api/qa';
import { Lead } from '@/types/lead';
import { notFound } from 'next/navigation';
import { LeadInfo } from '@/components/leads/LeadInfo';
import { NotesSection } from '@/components/leads/NotesSection';
import { TagsManager } from '@/components/leads/TagsManager';
import { WhatsAppConversation } from '@/components/leads/WhatsAppConversation';
import { LeadDetailActions } from '@/components/leads/LeadDetailActions';
import { ScoreDisplay } from '@/components/leads/ScoreDisplay';
import { QAAnswersTable } from '@/components/leads/QAAnswersTable';
import { ManualPollTrigger } from '@/components/leads/ManualPollTrigger';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import pb from '@/lib/pocketbase';

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

async function getLead(id: string): Promise<Lead> {
  try {
    return await fetchLead(id);
  } catch (error) {
    notFound();
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const lead = await getLead(params.id);
  const answers = await getLeadAnswers(lead.id);

  // Get current user for role check
  const user = pb.authStore.model as any;
  const isAdmin = user?.role === 'admin';

  // Prepare score breakdown for display
  const scoreBreakdown = answers.map((answer: any) => {
    const question = answer.expand?.question_id;
    return {
      question: question?.question_text || 'Soru',
      answer: answer.selected_answer || '-',
      points: answer.points_earned || 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
            <p className="text-muted-foreground">
              {lead.company || 'Müşteri Adayı Detayı'}
            </p>
          </div>
        </div>
        <LeadDetailActions leadId={lead.id} leadName={lead.name} lead={lead} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadInfo lead={lead} />

          {/* QA Scoring Section */}
          {lead.qa_sent && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Qualification Sonucu</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ScoreDisplay
                  totalScore={lead.total_score || lead.score || 0}
                  quality={lead.quality || 'pending'}
                  breakdown={scoreBreakdown}
                />
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Durum</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Poll Gönderildi:</span>
                      <span className="font-medium">
                        {lead.qa_sent_at ? new Date(lead.qa_sent_at).toLocaleString('tr-TR') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cevaplandı:</span>
                      <span className="font-medium">
                        {lead.qa_completed_at ? new Date(lead.qa_completed_at).toLocaleString('tr-TR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* QA Answers Section */}
          {lead.qa_sent && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">QA Cevapları</h2>
              <QAAnswersTable leadId={lead.id} />
            </section>
          )}

          <WhatsAppConversation leadId={lead.id} />
          <NotesSection leadId={lead.id} />
        </div>
        <div className="space-y-6">
          <TagsManager leadId={lead.id} currentTags={lead.tags} />

          {/* Admin Actions Section */}
          {isAdmin && (
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Yönetici İşlemleri</h3>
              <div className="flex flex-col gap-2">
                <ManualPollTrigger
                  leadId={lead.id}
                  qaCompleted={lead.qa_completed}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Manuel olarak poll tekrar gönder
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
