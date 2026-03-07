import PocketBase from 'pocketbase';
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
import { formatPollMessage as formatWhatsAppPollMessage } from '@/lib/whatsapp/message-formatter';

// Create dedicated PocketBase instance for Leads to prevent auto-cancellation
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

// Load auth from cookie if available (client-side only)
if (typeof window !== 'undefined') {
  const cookies = document.cookie.split(';');
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
  if (pbCookie) {
    try {
      pb.authStore.loadFromCookie(pbCookie.trim());
    } catch (e) {
      console.warn('Failed to load auth from cookie:', e);
    }
  }
}

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
 * Note: Returns lead without triggering poll (poll must be triggered manually or via API)
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

  return record;
}

/**
 * Update an existing lead
 */
export async function updateLead(
  id: string,
  data: UpdateLeadDto,
  options?: { force?: boolean; userRole?: 'admin' | 'sales' | 'marketing' }
): Promise<Lead> {
  // Get current lead to check if status is auto-updated
  const currentLead = await pb.collection('leads').getOne<Lead>(id);

  // If status is being changed and it was auto-updated
  if (data.status && data.status !== currentLead.status && currentLead.auto_updated_status) {
    const userRole = options?.userRole || 'sales';

    // Check if user is admin
    if (userRole !== 'admin') {
      throw new Error('Otomatik güncellenen statüyü değiştirmek için admin yetkisi gerekli.');
    }

    // Check if admin is forcing the override
    if (!options?.force) {
      throw new Error('Statüyü değiştirmek için "Zorla" checkbox\'unu işaretleyin.');
    }

    // Clear auto-updated flags when admin overrides
    data.auto_updated_status = false;
    data.auto_updated_at = undefined;
  }

  return await pb.collection('leads').update<Lead>(id, data);
}

/**
 * Delete a lead and all related records (cascade delete)
 */
export async function deleteLead(id: string): Promise<void> {
  try {
    // Delete related records first (PocketBase doesn't have cascade delete)
    // Email messages
    const emailMessages = await pb.collection('email_messages').getList(1, 100, {
      filter: `lead_id = "${id}"`
    });
    for (const msg of emailMessages.items) {
      await pb.collection('email_messages').delete(msg.id);
    }

    // WhatsApp messages
    const whatsappMessages = await pb.collection('whatsapp_messages').getList(1, 100, {
      filter: `lead_id = "${id}"`
    });
    for (const msg of whatsappMessages.items) {
      await pb.collection('whatsapp_messages').delete(msg.id);
    }

    // QA answers
    const qaAnswers = await pb.collection('qa_answers').getList(1, 100, {
      filter: `lead_id = "${id}"`
    });
    for (const ans of qaAnswers.items) {
      await pb.collection('qa_answers').delete(ans.id);
    }

    // Appointments
    const appointments = await pb.collection('appointments').getList(1, 100, {
      filter: `lead_id = "${id}"`
    });
    for (const apt of appointments.items) {
      await pb.collection('appointments').delete(apt.id);
    }

    // Notes
    const notes = await pb.collection('notes').getList(1, 100, {
      filter: `leadId = "${id}"`
    });
    for (const note of notes.items) {
      await pb.collection('notes').delete(note.id);
    }

    // Finally delete the lead
    await pb.collection('leads').delete(id);
  } catch (error) {
    console.error('Delete lead error:', error);
    throw error;
  }
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
  try {
    const response = await pb.collection('notes').getList<Note>(1, 50, {
      filter: `leadId = "${leadId}"`,
      sort: '-created',
      expand: 'userId',
    });

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('Get notes error:', error);
    return [];
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  await pb.collection('notes').delete(noteId);
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
    const pollMessage = formatWhatsAppPollMessage(lead, questions);

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
