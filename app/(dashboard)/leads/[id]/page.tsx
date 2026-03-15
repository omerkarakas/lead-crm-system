import { getServerPb } from '@/lib/pocketbase/server';
import { Lead } from '@/types/lead';
import { notFound } from 'next/navigation';
import { LeadInfo } from '@/components/leads/LeadInfo';
import { NotesSection } from '@/components/leads/NotesSection';
import { TagsManager } from '@/components/leads/TagsManager';
import { WhatsAppConversation } from '@/components/leads/WhatsAppConversation';
import { LeadDetailActions } from '@/components/leads/LeadDetailActions';
import { QualificationSection } from '@/components/leads/QualificationSection';
import { EmailHistory } from '@/components/leads/EmailHistory';
import { LeadDetailProposalsTab } from '@/components/leads/LeadDetailProposalsTab';
import { LeadEnrollments } from '@/components/leads/LeadEnrollments';
import { EnrollmentBadge } from '@/components/leads/EnrollmentBadge';
import { LeadQualityBadge } from '@/components/leads/LeadQualityBadge';
import { ActivityTimeline } from '@/components/leads/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { calculateQualityStatus } from '@/lib/utils/lead-scoring';

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
    });

    // Fetch questions manually since expand might not work
    const questionIds = [...new Set(answers.items.map((a: any) => a.question_id))];
    const questions = questionIds.length > 0
      ? await pb.collection('qa_questions').getList(1, 100, {
          filter: questionIds.map((id) => `id = "${id}"`).join(' || '),
        })
      : { items: [] };

    // Create a map for quick lookup
    const questionMap = new Map(questions.items.map((q: any) => [q.id, q]));

    // Attach questions to answers
    const answersWithQuestions = answers.items.map((answer: any) => ({
      ...answer,
      expand: { question_id: questionMap.get(answer.question_id) },
    }));

    return { lead, answers: answersWithQuestions };
  } catch (error) {
    notFound();
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { lead, answers } = await getLeadData(params.id);

  // Prepare score breakdown for display
  const scoreBreakdown = answers.map((answer: any, idx: number) => {
    const question = answer.expand?.question_id;
    const selectedOption = (answer.selected_answer || '').toLowerCase(); // e.g., "a"

    // Debug log
    console.log(`[Breakdown ${idx}]`, {
      question,
      question_text: question?.question_text,
      options: question?.options,
      selectedOption,
      points: answer.points_earned
    });

    // Build full option text: "a) [option text]"
    let optionText = `${selectedOption})`; // default fallback

    if (question?.options && Array.isArray(question.options)) {
      // Try to find option that starts with "a)" or "a) "
      const foundOption = question.options.find((opt: string) => {
        const normalized = opt.toLowerCase().trim();
        return normalized.startsWith(selectedOption + ')') ||
               normalized.startsWith(selectedOption + ') ');
      });

      if (foundOption) {
        optionText = foundOption;
      } else {
        // Try to find by index (a=0, b=1, c=2...)
        const optionIndex = selectedOption.charCodeAt(0) - 97; // 'a' = 97
        if (optionIndex >= 0 && optionIndex < question.options.length) {
          const optAtIdx = question.options[optionIndex];
          // If it doesn't start with the letter, prefix it
          if (optAtIdx.toLowerCase().startsWith(selectedOption + ')')) {
            optionText = optAtIdx;
          } else {
            optionText = `${selectedOption}) ${optAtIdx}`;
          }
        }
      }
    }

    return {
      questionNumber: question?.order || idx + 1,
      questionText: question?.question_text || '',
      selectedOption: selectedOption,
      selectedOptionText: optionText,
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
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                {lead.company || 'Müşteri Adayı Detayı'}
              </p>
              <LeadQualityBadge
                quality={calculateQualityStatus(lead.total_score || lead.score || 0, lead.qa_completed)}
                score={lead.total_score || lead.score || 0}
                size="md"
              />
              {(lead as any).enrollment_count > 0 && (
                <EnrollmentBadge enrollmentCount={(lead as any).enrollment_count || 0} />
              )}
            </div>
          </div>
        </div>
        <LeadDetailActions leadId={lead.id} leadName={lead.name} lead={lead} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadInfo lead={lead} />

          {/* QA Scoring Section */}
          {lead.qa_sent && (
            <QualificationSection
              leadId={lead.id}
              leadName={lead.name}
              totalScore={lead.total_score || lead.score || 0}
              quality={lead.quality || 'pending'}
              scoreBreakdown={scoreBreakdown}
              qaCompleted={lead.qa_completed}
              qaSentAt={lead.qa_sent_at}
              qaCompletedAt={lead.qa_completed_at}
            />
          )}

          {/* Tabs for WhatsApp, Email, Appointments, Proposals, Campaigns, Notes */}
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">E-posta</TabsTrigger>
              <TabsTrigger value="appointments">Randevular</TabsTrigger>
              <TabsTrigger value="proposals">Teklif</TabsTrigger>
              <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
              <TabsTrigger value="notes">Notlar</TabsTrigger>
              <TabsTrigger value="timeline">Aktivite</TabsTrigger>
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

            <TabsContent value="campaigns" className="mt-4">
              <LeadEnrollments leadId={lead.id} />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesSection leadId={lead.id} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ActivityTimeline leadId={lead.id} />
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
