import { getServerPb } from '@/lib/pocketbase/server';
import { Lead } from '@/types/lead';
import { notFound } from 'next/navigation';
import { LeadInfo } from '@/components/leads/LeadInfo';
import { NotesSection } from '@/components/leads/NotesSection';
import { TagsManager } from '@/components/leads/TagsManager';
import { WhatsAppConversation } from '@/components/leads/WhatsAppConversation';
import { LeadDetailActions } from '@/components/leads/LeadDetailActions';
import { ScoreDisplay } from '@/components/leads/ScoreDisplay';
import { QAAnswersTable } from '@/components/leads/QAAnswersTable';
import { EmailHistory } from '@/components/leads/EmailHistory';
import { LeadDetailProposalsTab } from '@/components/leads/LeadDetailProposalsTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Client component for appointments tab to handle state
import { ClientAppointmentTab } from '@/components/leads/ClientAppointmentTab';

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

async function getLeadData(id: string) {
  const pb = await getServerPb();
  try {
    const lead = await pb.collection('leads').getOne<Lead>(id);
    const answers = await pb.collection('qa_answers').getList(1, 50, {
      filter: `lead_id = "${id}"`,
      expand: 'question_id',
    });
    return { lead, answers: answers.items };
  } catch (error) {
    notFound();
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { lead, answers } = await getLeadData(params.id);

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

          {/* Tabs for WhatsApp, Email, Appointments, Proposals, Notes */}
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">E-posta</TabsTrigger>
              <TabsTrigger value="appointments">Randevular</TabsTrigger>
              <TabsTrigger value="proposals">Teklif</TabsTrigger>
              <TabsTrigger value="notes">Notlar</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="mt-4">
              <WhatsAppConversation leadId={lead.id} />
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <EmailHistory leadId={lead.id} />
            </TabsContent>

            <TabsContent value="appointments" className="mt-4">
              <ClientAppointmentTab leadId={lead.id} leadName={lead.name} />
            </TabsContent>

            <TabsContent value="proposals" className="mt-4">
              <LeadDetailProposalsTab
                leadId={lead.id}
                leadName={lead.name}
                leadPhone={lead.phone}
                leadCompany={lead.company}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesSection leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-6">
          <TagsManager leadId={lead.id} currentTags={lead.tags} />
        </div>
      </div>
    </div>
  );
}
