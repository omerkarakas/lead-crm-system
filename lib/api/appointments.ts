import PocketBase from 'pocketbase';
import { updateLead } from '@/lib/api/leads';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';
import {
  formatConfirmationMessage,
  format24hReminderMessage,
  format2hReminderMessage,
  formatCancellationMessage,
  formatRescheduledMessage
} from '@/lib/whatsapp/appointment-messages';
import type { Lead } from '@/types/lead';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentStatus
} from '@/types/appointment';
import type { WhatsAppMessage } from '@/types/qa';

// Create dedicated PocketBase instance for Appointments to prevent auto-cancellation
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
 * Create a new appointment record
 */
export async function createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
  const createData: Record<string, unknown> = {
    calcom_booking_id: data.calcom_booking_id,
    scheduled_at: data.scheduled_at,
    status: data.status || 'scheduled',
    source: data.source || 'calcom',
    duration: data.duration || 60,
    confirmation_sent: false,
    reminder_24h_sent: false,
    reminder_2h_sent: false
  };

  // Only add lead_id if provided (for failed bookings without lead match)
  if (data.lead_id) {
    createData.lead_id = data.lead_id;
  }

  // Optional fields
  if (data.calcom_event_id) createData.calcom_event_id = data.calcom_event_id;
  if (data.location) createData.location = data.location;
  if (data.meeting_url) createData.meeting_url = data.meeting_url;
  if (data.notes) createData.notes = data.notes;

  const record = await pb.collection('appointments').create<Appointment>(createData);

  return record;
}

/**
 * Match lead to appointment by phone first, then email
 * - FIRST: Try to find lead by phone number (exact match, strip +90 prefix if present)
 * - SECOND: If no match by phone, try email (case-insensitive match)
 */
export async function matchLeadToAppointment(
  phone: string | undefined,
  email: string
): Promise<Lead | null> {
  try {
    // FIRST: Try to find lead by phone number (if provided)
    if (phone && phone.trim() !== '') {
      // Clean phone: remove non-numeric chars and strip +90 prefix if present
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneWithoutPrefix = cleanPhone.startsWith('90') && cleanPhone.length === 12
        ? cleanPhone.substring(2)
        : cleanPhone;

      // Try exact match with cleaned phone
      const phoneResponse = await pb.collection('leads').getList<Lead>(1, 1, {
        filter: `phone = "${phoneWithoutPrefix}" || phone = "+${phoneWithoutPrefix}" || phone = "0${phoneWithoutPrefix}"`,
        sort: '-created'
      });

      if (phoneResponse.items.length > 0) {
        return phoneResponse.items[0];
      }
    }

    // SECOND: If no match by phone, try email
    if (email && email.trim() !== '') {
      const emailResponse = await pb.collection('leads').getList<Lead>(1, 1, {
        filter: `email ~ "${email.toLowerCase()}"`,
        sort: '-created'
      });

      if (emailResponse.items.length > 0) {
        return emailResponse.items[0];
      }
    }

    return null;
  } catch (error) {
    console.error('Match lead to appointment error:', error);
    return null;
  }
}

/**
 * Update lead status to 'booked'
 */
export async function updateLeadStatusToBooked(leadId: string): Promise<void> {
  await updateLead(leadId, { status: 'booked' });
}

/**
 * Get appointment by Cal.com booking ID (for idempotency)
 */
export async function getAppointmentByCalcomId(
  calcomBookingId: string
): Promise<Appointment | null> {
  try {
    const response = await pb.collection('appointments').getList<Appointment>(1, 1, {
      filter: `calcom_booking_id = "${calcomBookingId}"`
    });

    if (response.items.length > 0) {
      return response.items[0];
    }

    return null;
  } catch (error) {
    console.error('Get appointment by Calcom ID error:', error);
    return null;
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  return await pb.collection('appointments').update<Appointment>(id, { status });
}

/**
 * Get all appointments for a lead, sorted by scheduled_at DESC
 */
export async function getAppointmentsByLead(leadId: string): Promise<Appointment[]> {
  const response = await pb.collection('appointments').getList<Appointment>(1, 50, {
    filter: `lead_id = "${leadId}"`,
    sort: '-scheduled_at'
  });

  return response.items;
}

/**
 * Get upcoming appointments within next N hours that need reminders
 * Filter: status = 'scheduled', reminder not yet sent
 */
export async function getUpcomingAppointments(hours: number = 24): Promise<Appointment[]> {
  const now = new Date();
  const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const nowIso = now.toISOString();
  const futureTimeIso = futureTime.toISOString();

  const response = await pb.collection('appointments').getList<Appointment>(1, 100, {
    filter: `status = "scheduled" && scheduled_at >= "${nowIso}" && scheduled_at <= "${futureTimeIso}"`,
    sort: 'scheduled_at'
  });

  return response.items;
}

/**
 * Fetch a single appointment by ID
 */
export async function fetchAppointment(id: string): Promise<Appointment> {
  return await pb.collection('appointments').getOne<Appointment>(id);
}

/**
 * Update an appointment
 */
export async function updateAppointment(
  id: string,
  data: UpdateAppointmentDto
): Promise<Appointment> {
  return await pb.collection('appointments').update<Appointment>(id, data);
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<void> {
  await pb.collection('appointments').delete(id);
}

/**
 * Get all appointments with pagination and filtering
 */
export async function fetchAppointments(params: {
  page?: number;
  perPage?: number;
  leadId?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: string;
} = {}): Promise<{
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: Appointment[];
}> {
  const {
    page = 1,
    perPage = 50,
    leadId,
    status,
    startDate,
    endDate,
    search,
    sort = '-scheduled_at'
  } = params;

  const filterParts: string[] = [];

  // Lead filter
  if (leadId) {
    filterParts.push(`lead_id = "${leadId}"`);
  }

  // Status filter
  if (status) {
    filterParts.push(`status = "${status}"`);
  }

  // Date range filter
  if (startDate) {
    filterParts.push(`scheduled_at >= "${startDate}"`);
  }
  if (endDate) {
    filterParts.push(`scheduled_at <= "${endDate}"`);
  }

  // Search filter (by lead name via relation)
  if (search) {
    filterParts.push(`lead_id.name ~ "${search}" || lead_id.phone ~ "${search}"`);
  }

  const options: any = { sort };

  if (filterParts.length > 0) {
    options.filter = filterParts.join(' && ');
  }

  const response = await pb.collection('appointments').getList<Appointment>(
    page,
    perPage,
    options
  );

  return {
    page: response.page,
    perPage: response.perPage,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
    items: response.items
  };
}

/**
 * Format phone number for Green API (add country code if missing)
 */
function formatPhoneForWhatsApp(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');

  // If starts with 90 and has 12 digits, use it with +
  if (cleanPhone.startsWith('90') && cleanPhone.length === 12) {
    return `+${cleanPhone}`;
  }

  // If has 10 digits, add +90 prefix
  if (cleanPhone.length === 10) {
    return `+90${cleanPhone}`;
  }

  // Already has + or other format
  if (phone.startsWith('+')) {
    return phone;
  }

  return `+${cleanPhone}`;
}

/**
 * Send appointment confirmation message via WhatsApp
 * Updates confirmation_sent flag after sending
 */
export async function sendAppointmentConfirmation(appointmentId: string): Promise<void> {
  try {
    // Fetch appointment with lead relation
    const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      console.warn(`[sendAppointmentConfirmation] No lead associated with appointment ${appointmentId}`);
      return;
    }

    const lead = appointment.expand?.lead_id as Lead;
    if (!lead) {
      console.warn(`[sendAppointmentConfirmation] Lead not found for appointment ${appointmentId}`);
      return;
    }

    // Format confirmation message
    const messageText = formatConfirmationMessage(lead.name, appointment);

    // Format phone number for WhatsApp
    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message to whatsapp_messages collection
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      // Update confirmation_sent flag
      await pb.collection('appointments').update(appointmentId, {
        confirmation_sent: true
      });

      console.log(`[sendAppointmentConfirmation] Confirmation sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('[sendAppointmentConfirmation] Error:', error);
    // Don't throw - handle errors gracefully
  }
}

/**
 * Send 24-hour reminder message via WhatsApp
 * Updates reminder_24h_sent flag after sending
 */
export async function send24hReminder(appointmentId: string): Promise<void> {
  try {
    // Fetch appointment with lead relation
    const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      console.warn(`[send24hReminder] No lead associated with appointment ${appointmentId}`);
      return;
    }

    const lead = appointment.expand?.lead_id as Lead;
    if (!lead) {
      console.warn(`[send24hReminder] Lead not found for appointment ${appointmentId}`);
      return;
    }

    // Format reminder message
    const messageText = format24hReminderMessage(lead.name, appointment);

    // Format phone number for WhatsApp
    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message to whatsapp_messages collection
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      // Update reminder_24h_sent flag
      await pb.collection('appointments').update(appointmentId, {
        reminder_24h_sent: true
      });

      console.log(`[send24hReminder] 24h reminder sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('[send24hReminder] Error:', error);
    // Don't throw - handle errors gracefully
  }
}

/**
 * Send 2-hour reminder message via WhatsApp
 * Updates reminder_2h_sent flag after sending
 */
export async function send2hReminder(appointmentId: string): Promise<void> {
  try {
    // Fetch appointment with lead relation
    const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      console.warn(`[send2hReminder] No lead associated with appointment ${appointmentId}`);
      return;
    }

    const lead = appointment.expand?.lead_id as Lead;
    if (!lead) {
      console.warn(`[send2hReminder] Lead not found for appointment ${appointmentId}`);
      return;
    }

    // Format reminder message
    const messageText = format2hReminderMessage(lead.name, appointment);

    // Format phone number for WhatsApp
    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message to whatsapp_messages collection
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      // Update reminder_2h_sent flag
      await pb.collection('appointments').update(appointmentId, {
        reminder_2h_sent: true
      });

      console.log(`[send2hReminder] 2h reminder sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('[send2hReminder] Error:', error);
    // Don't throw - handle errors gracefully
  }
}

/**
 * Send cancellation notice via WhatsApp
 * No flag update (status changed to cancelled)
 */
export async function sendCancellationNotice(appointmentId: string): Promise<void> {
  try {
    // Fetch appointment with lead relation
    const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      console.warn(`[sendCancellationNotice] No lead associated with appointment ${appointmentId}`);
      return;
    }

    const lead = appointment.expand?.lead_id as Lead;
    if (!lead) {
      console.warn(`[sendCancellationNotice] Lead not found for appointment ${appointmentId}`);
      return;
    }

    // Format cancellation message
    const messageText = formatCancellationMessage(lead.name, appointment);

    // Format phone number for WhatsApp
    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message to whatsapp_messages collection
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      console.log(`[sendCancellationNotice] Cancellation notice sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('[sendCancellationNotice] Error:', error);
    // Don't throw - handle errors gracefully
  }
}

/**
 * Send rescheduled notice via WhatsApp
 * Resets reminder flags (reminder_24h_sent = false, reminder_2h_sent = false)
 */
export async function sendRescheduledNotice(appointmentId: string): Promise<void> {
  try {
    // Fetch appointment with lead relation
    const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      console.warn(`[sendRescheduledNotice] No lead associated with appointment ${appointmentId}`);
      return;
    }

    const lead = appointment.expand?.lead_id as Lead;
    if (!lead) {
      console.warn(`[sendRescheduledNotice] Lead not found for appointment ${appointmentId}`);
      return;
    }

    // Format rescheduled message
    const messageText = formatRescheduledMessage(lead.name, appointment);

    // Format phone number for WhatsApp
    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message to whatsapp_messages collection
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      // Reset reminder flags for new time
      await pb.collection('appointments').update(appointmentId, {
        reminder_24h_sent: false,
        reminder_2h_sent: false
      });

      console.log(`[sendRescheduledNotice] Reschedule notice sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('[sendRescheduledNotice] Error:', error);
    // Don't throw - handle errors gracefully
  }
}

/**
 * Send pending reminders
 * Queries appointments needing reminders and sends them
 * Returns counts of sent and errors
 */
export async function sendPendingReminders(): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  try {
    const now = new Date();

    // Process 2-hour reminders (within next 2 hours)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHourWindowStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // Start checking 1 hour from now

    const twoHourReminders = await pb.collection('appointments').getList<Appointment>(1, 50, {
      filter: `status = "scheduled" && scheduled_at >= "${twoHourWindowStart.toISOString()}" && scheduled_at <= "${twoHoursFromNow.toISOString()}" && reminder_2h_sent = false`,
      sort: 'scheduled_at',
      expand: 'lead_id'
    });

    for (const appointment of twoHourReminders.items) {
      try {
        await send2hReminder(appointment.id);
        sent++;
      } catch (error) {
        console.error(`[sendPendingReminders] Error sending 2h reminder for ${appointment.id}:`, error);
        errors++;
      }
    }

    // Process 24-hour reminders (within next 24 hours but > 2 hours from now)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFourHourWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // Start checking 23 hours from now

    const twentyFourHourReminders = await pb.collection('appointments').getList<Appointment>(1, 50, {
      filter: `status = "scheduled" && scheduled_at >= "${twentyFourHourWindowStart.toISOString()}" && scheduled_at <= "${twentyFourHoursFromNow.toISOString()}" && reminder_24h_sent = false`,
      sort: 'scheduled_at',
      expand: 'lead_id'
    });

    for (const appointment of twentyFourHourReminders.items) {
      try {
        await send24hReminder(appointment.id);
        sent++;
      } catch (error) {
        console.error(`[sendPendingReminders] Error sending 24h reminder for ${appointment.id}:`, error);
        errors++;
      }
    }

    console.log(`[sendPendingReminders] Sent ${sent} reminders, ${errors} errors`);
  } catch (error) {
    console.error('[sendPendingReminders] Error:', error);
  }

  return { sent, errors };
}

/**
 * Cancel scheduled reminders for an appointment
 * Called when appointment is cancelled or completed
 * No actual reminder cancellation needed (status check prevents sending)
 * For future: could integrate with job queue to cancel scheduled jobs
 */
export async function cancelScheduledReminders(appointmentId: string): Promise<void> {
  try {
    // Status change to cancelled/completed prevents reminders from being sent
    // No additional action needed currently
    console.log(`[cancelScheduledReminders] Reminders cancelled for appointment ${appointmentId}`);
  } catch (error) {
    console.error('[cancelScheduledReminders] Error:', error);
  }
}

/**
 * Complete an appointment and update lead status based on proposal response
 * Returns appointment with lead status update info
 */
export async function completeAppointment(
  appointmentId: string
): Promise<{
  appointment: Appointment;
  statusUpdate?: {
    updated: boolean;
    previousStatus?: string;
    newStatus?: string;
    reason: string;
  };
}> {
  // Get appointment with lead relation
  const appointment = await pb.collection<Appointment>('appointments').getOne(appointmentId, {
    expand: 'lead_id'
  });

  if (!appointment.lead_id) {
    throw new Error('No lead associated with this appointment');
  }

  // Update appointment status to completed
  const updatedAppointment = await pb.collection<Appointment>('appointments').update(appointmentId, {
    status: 'completed'
  });

  // Check lead status based on proposal response
  const lead = appointment.expand?.lead_id as any;
  let statusUpdate = undefined;

  if (lead) {
    // Import updateLeadStatusBasedOnProposal dynamically to avoid circular dependency
    const { updateLeadStatusBasedOnProposal } = await import('@/lib/utils/status');

    // If status is already CUSTOMER or LOST, log it
    if (lead.status === 'customer' || lead.status === 'lost') {
      statusUpdate = {
        updated: false,
        previousStatus: lead.status,
        newStatus: lead.status,
        reason: lead.status === 'customer'
          ? 'Durum zaten müşteri (teklif kabul edildi)'
          : 'Durum zaten kaybedildi (teklif reddedildi)'
      };
    } else {
      // Check proposal response and update status
      statusUpdate = await updateLeadStatusBasedOnProposal(pb, appointment.lead_id);
    }
  }

  return {
    appointment: updatedAppointment,
    statusUpdate
  };
}
