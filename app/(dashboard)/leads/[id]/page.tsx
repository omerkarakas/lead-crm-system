import { getServerPb } from "@/lib/pocketbase/server";
import { Lead } from "@/types/lead";
import { notFound } from "next/navigation";
import { LeadInfo } from "@/components/leads/LeadInfo";
import { NotesSection } from "@/components/leads/NotesSection";
import { TagsManager } from "@/components/leads/TagsManager";
import { WhatsAppConversation } from "@/components/leads/WhatsAppConversation";
import { LeadDetailActions } from "@/components/leads/LeadDetailActions";
import { QualificationSection } from "@/components/leads/QualificationSection";
import { EmailHistory } from "@/components/leads/EmailHistory";
import { LeadDetailProposalsTab } from "@/components/leads/LeadDetailProposalsTab";
import { LeadEnrollments } from "@/components/leads/LeadEnrollments";
import { EnrollmentBadge } from "@/components/leads/EnrollmentBadge";
import { LeadQualityBadge } from "@/components/leads/LeadQualityBadge";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calculateQualityStatus } from "@/lib/utils/lead-scoring";
import { ClientAppointmentTab } from "@/components/leads/ClientAppointmentTab";

// Route segment config - disable all caching for this dynamic route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store'; // Additional Next.js 14+ config

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Fetch lead and related data from PocketBase
 */
async function getLeadData(id: string) {
  console.log('[LeadDetailPage] Fetching lead data for ID:', id);

  const pb = await getServerPb();
  console.log('[LeadDetailPage] PocketBase URL:', pb.baseUrl);
  console.log('[LeadDetailPage] Auth valid:', pb.authStore.isValid);

  try {
    // Fetch lead
    console.log('[LeadDetailPage] Attempting to fetch lead from collection...');
    const lead = await pb.collection<Lead>("leads").getOne(id, {
      requestKey: `lead-${id}-${Date.now()}`, // Unique request key to bypass cache
    });
    console.log('[LeadDetailPage] Lead fetched successfully:', lead.id, lead.name);

    // Fetch QA answers (optional - don't fail if missing)
    let answersWithQuestions: any[] = [];
    try {
      const answers = await pb.collection("qa_answers").getList(1, 50, {
        filter: `lead_id = "${id}"`,
        requestKey: `answers-${id}-${Date.now()}`,
      });
      console.log('[LeadDetailPage] QA answers fetched:', answers.items.length);

      // Fetch questions manually
      const questionIds = Array.from(new Set(answers.items.map((a: any) => a.question_id)));
      if (questionIds.length > 0) {
        const questions = await pb.collection("qa_questions").getList(1, 100, {
          filter: questionIds.map((id) => `id = "${id}"`).join(" || "),
          requestKey: `questions-${id}-${Date.now()}`,
        });

        const questionMap = new Map(questions.items.map((q: any) => [q.id, q]));
        answersWithQuestions = answers.items.map((answer: any) => ({
          ...answer,
          expand: { question_id: questionMap.get(answer.question_id) },
        }));
      }
    } catch (qaError) {
      console.warn('[LeadDetailPage] QA data fetch failed (non-critical):', qaError);
      // Don't fail the whole page if QA data is missing
    }

    return { lead, answers: answersWithQuestions };

  } catch (error: any) {
    console.error('[LeadDetailPage] Error fetching lead:', {
      message: error.message,
      status: error.status,
      data: error.data,
      id: id,
    });

    // Return null instead of calling notFound() immediately
    // This allows us to handle the error more gracefully
    return null;
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  console.log('[LeadDetailPage] Page render for ID:', params.id);

  const data = await getLeadData(params.id);

  // Check if data fetching failed
  if (!data) {
    console.error('[LeadDetailPage] No data returned, showing 404');
    notFound();
  }

  const { lead, answers } = data;

  // Prepare score breakdown for display
  const scoreBreakdown = answers.map((answer: any, idx: number) => {
    const question = answer.expand?.question_id;
    const selectedOption = (answer.selected_answer || "").toLowerCase();

    let optionText = `${selectedOption})`;

    if (question?.options && Array.isArray(question.options)) {
      const foundOption = question.options.find((opt: string) => {
        const normalized = opt.toLowerCase().trim();
        return normalized.startsWith(selectedOption + ")") || normalized.startsWith(selectedOption + ") ");
      });

      if (foundOption) {
        optionText = foundOption;
      } else {
        const optionIndex = selectedOption.charCodeAt(0) - 97;
        if (optionIndex >= 0 && optionIndex < question.options.length) {
          const optAtIdx = question.options[optionIndex];
          if (optAtIdx.toLowerCase().startsWith(selectedOption + ")")) {
            optionText = optAtIdx;
          } else {
            optionText = `${selectedOption}) ${optAtIdx}`;
          }
        }
      }
    }

    return {
      questionNumber: question?.order || idx + 1,
      questionText: question?.question_text || "",
      selectedOption: selectedOption,
      selectedOptionText: optionText,
      points: answer.points_earned || 0,
    };
  });

  console.log('[LeadDetailPage] Rendering lead:', lead.id, lead.name);

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
              <p className="text-muted-foreground">{lead.company || "Müşteri Adayı Detayı"}</p>
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

          {lead.qa_sent && (
            <QualificationSection
              leadId={lead.id}
              leadName={lead.name}
              totalScore={lead.total_score || lead.score || 0}
              quality={lead.quality || "pending"}
              scoreBreakdown={scoreBreakdown}
              qaCompleted={lead.qa_completed}
              qaSentAt={lead.qa_sent_at ?? null}
              qaCompletedAt={lead.qa_completed_at ?? null}
            />
          )}

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
