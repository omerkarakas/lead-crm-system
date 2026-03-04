import pb from '@/lib/pocketbase';
import { updateLead } from '@/lib/api/leads';
import type { Lead } from '@/types/lead';
import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentStatus
} from '@/types/appointment';

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
