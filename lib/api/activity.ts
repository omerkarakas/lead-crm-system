import PocketBase from 'pocketbase';
import {
  ActivityEvent,
  ActivityType,
  TimelineResponse,
  TimelineFilters
} from '@/types/activity';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * Fetch all activity events for a lead
 */
export async function fetchActivityTimeline(
  leadId: string,
  filters?: TimelineFilters,
  page = 1,
  perPage = 50
): Promise<TimelineResponse> {
  const pb = new PocketBase(PB_URL);

  // Load auth if available (client-side)
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    const pbCookie = cookies.find((c) => c.trim().startsWith('pb_auth='));
    if (pbCookie) {
      try {
        pb.authStore.loadFromCookie(pbCookie.trim());
      } catch (e) {
        console.warn('Failed to load auth from cookie:', e);
      }
    }
  }

  const events: ActivityEvent[] = [];

  // Fetch notes
  try {
    const notes = await pb.collection('notes').getList(1, 100, {
      filter: `leadId = "${leadId}"`,
      sort: '-created',
      expand: 'userId'
    });
    events.push(
      ...notes.items.map((note: any): ActivityEvent => ({
        id: `note-${note.id}`,
        type: ActivityType.Note,
        timestamp: note.created,
        leadId,
        content: note.content,
        userId: note.userId,
        userName: note.expand?.userId?.name
      }))
    );
  } catch (error) {
    console.error('Error fetching notes:', error);
  }

  // Fetch WhatsApp messages
  try {
    const whatsappMessages = await pb.collection('whatsapp_messages').getList(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-sent_at'
    });
    events.push(
      ...whatsappMessages.items.map((msg: any): ActivityEvent => ({
        id: `whatsapp-${msg.id}`,
        type: ActivityType.WhatsApp,
        timestamp: msg.sent_at,
        leadId,
        direction: msg.direction,
        message: msg.message_text,
        status: msg.status,
        messageType: msg.message_type
      }))
    );
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
  }

  // Fetch email messages
  try {
    const emailMessages = await pb.collection('email_messages').getList(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-sent_at'
    });
    events.push(
      ...emailMessages.items.map((msg: any): ActivityEvent => ({
        id: `email-${msg.id}`,
        type: ActivityType.Email,
        timestamp: msg.sent_at,
        leadId,
        subject: msg.subject,
        status: msg.status,
        templateId: msg.template_id
      }))
    );
  } catch (error) {
    console.error('Error fetching email messages:', error);
  }

  // Fetch QA answers
  try {
    const qaAnswers = await pb.collection('qa_answers').getList(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-created',
      expand: 'question_id'
    });
    events.push(
      ...qaAnswers.items.map((ans: any): ActivityEvent => {
        const question = ans.expand?.question_id;
        return {
          id: `qa-${ans.id}`,
          type: ActivityType.QAAnswer,
          timestamp: ans.created,
          leadId,
          question: question?.question_text || 'Soru',
          answer: ans.selected_answer || '-',
          pointsEarned: ans.points_earned || 0
        };
      })
    );
  } catch (error) {
    console.error('Error fetching QA answers:', error);
  }

  // Fetch appointments
  try {
    const appointments = await pb.collection('appointments').getList(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-created'
    });
    events.push(
      ...appointments.items.map((apt: any): ActivityEvent => ({
        id: `appointment-${apt.id}`,
        type: ActivityType.Appointment,
        timestamp: apt.created,
        leadId,
        action: 'created',
        scheduledAt: apt.scheduled_at,
        status: apt.status
      }))
    );
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }

  // Fetch campaign enrollments
  try {
    const enrollments = await pb.collection('campaign_enrollments').getList(1, 100, {
      filter: `lead_id = "${leadId}"`,
      sort: '-created',
      expand: 'campaign_id'
    });
    events.push(
      ...enrollments.items.map((enr: any): ActivityEvent => {
        const campaign = enr.expand?.campaign_id;
        return {
          id: `enrollment-${enr.id}`,
          type: ActivityType.CampaignEnrolled,
          timestamp: enr.created,
          leadId,
          campaignId: enr.campaign_id,
          campaignName: campaign?.name || 'Kampanya',
          sequenceCount: campaign?.sequence_count || 0
        };
      })
    );
  } catch (error) {
    console.error('Error fetching campaign enrollments:', error);
  }

  // Fetch lead for status changes and creation
  try {
    const lead = await pb.collection('leads').getOne(leadId);

    // Lead created event
    events.push({
      id: 'lead-created',
      type: ActivityType.LeadCreated,
      timestamp: lead.created,
      leadId
    } as ActivityEvent);

    // If has proposal data, add proposal events
    if (lead.offer_date) {
      events.push({
        id: 'proposal-sent',
        type: ActivityType.ProposalSent,
        timestamp: lead.offer_date,
        leadId,
        proposalId: lead.offer_document_url
      } as ActivityEvent);
    }

    if (lead.offer_responded_at && lead.offer_response) {
      events.push({
        id: 'proposal-response',
        type: ActivityType.ProposalResponse,
        timestamp: lead.offer_responded_at,
        leadId,
        response: lead.offer_response
      } as ActivityEvent);
    }
  } catch (error) {
    console.error('Error fetching lead:', error);
  }

  // Sort all events by timestamp (newest first)
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply type filters if provided
  let filteredEvents = events;
  if (filters?.types && filters.types.length > 0) {
    filteredEvents = events.filter((e) => filters.types!.includes(e.type));
  }

  // Apply date filters if provided
  if (filters?.startDate) {
    filteredEvents = filteredEvents.filter(
      (e) => new Date(e.timestamp) >= new Date(filters.startDate!)
    );
  }
  if (filters?.endDate) {
    filteredEvents = filteredEvents.filter(
      (e) => new Date(e.timestamp) <= new Date(filters.endDate!)
    );
  }

  // Pagination
  const startIndex = (page - 1) * perPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + perPage);

  return {
    events: paginatedEvents,
    total: filteredEvents.length,
    hasMore: startIndex + perPage < filteredEvents.length
  };
}

/**
 * Get activity summary stats
 */
export async function getActivitySummary(leadId: string): Promise<{
  totalEvents: number;
  whatsappCount: number;
  emailCount: number;
  noteCount: number;
  appointmentCount: number;
}> {
  const timeline = await fetchActivityTimeline(leadId);

  return {
    totalEvents: timeline.total,
    whatsappCount: timeline.events.filter((e) => e.type === ActivityType.WhatsApp)
      .length,
    emailCount: timeline.events.filter((e) => e.type === ActivityType.Email).length,
    noteCount: timeline.events.filter((e) => e.type === ActivityType.Note).length,
    appointmentCount: timeline.events.filter(
      (e) => e.type === ActivityType.Appointment
    ).length
  };
}
