import pb from '@/lib/pocketbase';
import type {
  Lead,
  CreateLeadDto,
  UpdateLeadDto,
  Note,
  CreateNoteDto,
  LeadsResponse,
  LeadsListParams,
} from '@/types/lead';
import { fetchActiveQuestions } from '@/lib/api/qa';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';
import { QA_CONFIG, formatWelcomeMessage } from '@/lib/config/qa';

/**
 * Fetch all leads with pagination and filtering
 */
export async function fetchLeads(params: LeadsListParams = {}): Promise<LeadsResponse> {
  const {
    page = 1,
    perPage = 50,
    search = '',
    status,
    tags,
    sort = '-created',
  } = params;

  const filterParts: string[] = [];

  // Search filter (name, phone, or email)
  if (search) {
    filterParts.push(`name ~ "${search}" || phone ~ "${search}" || email ~ "${search}"`);
  }

  // Status filter
  if (status) {
    filterParts.push(`status = "${status}"`);
  }

  // Tags filter (any of the provided tags)
  if (tags && tags.length > 0) {
    const tagFilters = tags.map(tag => `tags ~ "${tag}"`);
    filterParts.push(`(${tagFilters.join(' || ')})`);
  }

  const options: any = { sort };

  // Only add filter if it exists
  if (filterParts.length > 0) {
    options.filter = filterParts.join(' && ');
  }

  const response = await pb.collection('leads').getList<Lead>(page, perPage, options);

  return {
    page: response.page,
    perPage: response.perPage,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
    items: response.items,
  };
}

/**
 * Fetch a single lead by ID
 */
export async function fetchLead(id: string): Promise<Lead> {
  return await pb.collection('leads').getOne<Lead>(id);
}

/**
 * Create a new lead
 */
export async function createLead(data: CreateLeadDto): Promise<Lead> {
  const userId = pb.authStore.model?.id;

  const record = await pb.collection('leads').create<Lead>({
    ...data,
    createdBy: userId,
    status: data.status || 'new',
    score: data.score ?? 0,
    quality: data.quality || 'pending',
    tags: data.tags || [],
    qa_sent: false,
    qa_completed: false,
  });

  // Trigger background job (fire and forget)
  sendPollAfterDelay(record.id).catch(err =>
    console.error('Poll send background job error:', err)
  );

  return record;
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, data: UpdateLeadDto): Promise<Lead> {
  return await pb.collection('leads').update<Lead>(id, data);
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  await pb.collection('leads').delete(id);
}

/**
 * Add a note to a lead
 */
export async function addNote(data: CreateNoteDto): Promise<Note> {
  const userId = pb.authStore.model?.id;

  if (!userId) {
    throw new Error('Oturum açmanız gerekiyor');
  }

  const record = await pb.collection('notes').create<Note>({
    leadId: data.leadId,
    userId: userId,
    content: data.content,
  });

  return record;
}

/**
 * Get notes for a lead
 */
export async function getNotes(leadId: string): Promise<Note[]> {
  const response = await pb.collection('notes').getList<Note>(1, 50, {
    filter: `leadId = "${leadId}"`,
    sort: '-created',
    expand: 'userId',
  });

  return response.items;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  await pb.collection('notes').delete(noteId);
}

/**
 * Format poll message for WhatsApp
 */
function formatPollMessage(lead: Lead, questions: any[]): string {
  // Format welcome message
  let welcome = formatWelcomeMessage(lead.name || 'Değerli Müşterimiz', lead.company);

  // Format questions
  const questionsText = questions.map((q, index) => {
    const num = index + 1;
    const options = q.options.join('\n   ');
    return `${num}. ${q.question_text}\n   ${options}`;
  }).join('\n\n');

  return welcome + '\n\n' + questionsText + QA_CONFIG.pollFooter;
}

/**
 * Send poll after 1 minute delay
 */
export async function sendPollAfterDelay(leadId: string): Promise<void> {
  // 1 minute delay
  await new Promise(resolve => setTimeout(resolve, 60000));

  try {
    // Fetch lead
    const lead = await fetchLead(leadId);
    if (!lead || !lead.phone) {
      console.error('Lead not found or no phone:', leadId);
      return;
    }

    // Skip if already sent
    if (lead.qa_sent) {
      console.log('QA poll already sent for lead:', leadId);
      return;
    }

    // Fetch active questions
    const questions = await fetchActiveQuestions();
    if (questions.length === 0) {
      console.error('No active questions found');
      return;
    }

    // Format poll message
    const pollMessage = formatPollMessage(lead, questions);

    // Send WhatsApp
    const chatId = lead.phone.replace(/\D/g, '') + '@c.us';
    const result = await sendWhatsAppMessage(chatId, pollMessage);

    if (!result) {
      console.error('Failed to send WhatsApp message');
      return;
    }

    // Log message
    await logWhatsAppMessage({
      lead_id: leadId,
      direction: 'outgoing',
      message_text: pollMessage,
      message_type: 'poll',
      status: 'sent',
      sent_at: new Date().toISOString(),
      green_api_id: result.idMessage
    });

    // Update lead: qa_sent = true
    await updateLead(leadId, {
      qa_sent: true,
      qa_sent_at: new Date().toISOString()
    });

    console.log('QA poll sent successfully to lead:', leadId);
  } catch (error) {
    console.error('Error sending poll after delay:', error);
  }
}

/**
 * Find lead by phone number
 */
export async function findLeadByPhone(phone: string): Promise<Lead | null> {
  try {
    // Remove @c.us suffix if present
    const cleanPhone = phone.replace('@c.us', '').replace(/\D/g, '');

    const response = await pb.collection('leads').getList<Lead>(1, 1, {
      filter: `phone ~ "${cleanPhone}"`,
      sort: '-created'
    });

    if (response.items.length > 0) {
      return response.items[0];
    }

    return null;
  } catch (error) {
    console.error('Find lead by phone error:', error);
    return null;
  }
}
