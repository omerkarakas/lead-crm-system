/**
 * Appointment status enum
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no-show'
}

/**
 * Appointment source enum
 */
export enum AppointmentSource {
  CALCOM = 'calcom',
  MANUAL = 'manual'
}

/**
 * Appointment interface
 */
export interface Appointment {
  id: string;
  lead_id?: string;
  calcom_booking_id: string;
  calcom_event_id?: string;
  scheduled_at: string;
  duration?: number;
  location?: string;
  meeting_url?: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  confirmation_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  notes?: string;
  created: string;
  updated: string;
  expand?: {
    lead_id?: {
      id: string;
      name: string;
      phone?: string;
      email?: string;
      company?: string;
      offer_response?: string;
    };
  };
}

/**
 * DTO for creating appointment
 */
export interface CreateAppointmentDto {
  lead_id?: string;
  calcom_booking_id: string;
  calcom_event_id?: string;
  scheduled_at: string;
  duration?: number;
  location?: string;
  meeting_url?: string;
  status?: AppointmentStatus;
  source?: AppointmentSource;
  notes?: string;
}

/**
 * DTO for updating appointment
 */
export interface UpdateAppointmentDto {
  scheduled_at?: string;
  duration?: number;
  location?: string;
  meeting_url?: string;
  status?: AppointmentStatus;
  confirmation_sent?: boolean;
  reminder_24h_sent?: boolean;
  reminder_2h_sent?: boolean;
  notes?: string;
}

/**
 * Cal.com webhook payload structure
 */
export interface CalcomBookingPayload {
  uid: string;
  eventTypeId?: string;
  startTime: string;
  endTime: string;
  attendee: {
    email: string;
    phone?: string;
    name: string;
  };
  location?: string;
  metadata?: Record<string, unknown>;
  status?: string;
}
