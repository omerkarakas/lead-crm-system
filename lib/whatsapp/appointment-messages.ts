import type { Appointment } from '@/types/appointment';

/**
 * Format Turkish date for WhatsApp messages (DD.MM.YYYY)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Format Turkish time for WhatsApp messages (HH:MM)
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Format appointment confirmation message
 *
 * Turkish language WhatsApp message for appointment confirmation
 * Includes: lead name, date (DD.MM.YYYY), time (HH:MM), location/meeting URL
 */
export function formatConfirmationMessage(leadName: string, appointment: Appointment): string {
  const date = formatDate(appointment.scheduled_at);
  const time = formatTime(appointment.scheduled_at);

  let message = `Merhaba ${leadName}, randevunuz ${date} saat ${time}'e ayarlandı.`;

  // Add location or meeting URL
  if (appointment.meeting_url) {
    message += ` Online toplantı linki: ${appointment.meeting_url}`;
  } else if (appointment.location) {
    message += ` ${appointment.location}`;
  }

  message += '. İptal veya değişiklik için bize ulaşabilirsiniz.';

  return message;
}

/**
 * Format 24-hour reminder message
 *
 * Turkish language WhatsApp message sent 24 hours before appointment
 * Includes: lead name, date, time, location
 */
export function format24hReminderMessage(leadName: string, appointment: Appointment): string {
  const date = formatDate(appointment.scheduled_at);
  const time = formatTime(appointment.scheduled_at);

  let message = `Merhaba ${leadName}, yarın saat ${time}'eki randevunuzu hatırlatmak istedik.`;

  // Add location
  if (appointment.meeting_url) {
    message += ' Online toplantı.';
  } else if (appointment.location) {
    message += ` ${appointment.location}`;
  }

  message += ' Görüşmek üzere!';

  return message;
}

/**
 * Format 2-hour reminder message
 *
 * Turkish language WhatsApp message sent 2 hours before appointment
 * Includes: lead name, time, location
 */
export function format2hReminderMessage(leadName: string, appointment: Appointment): string {
  const time = formatTime(appointment.scheduled_at);

  let message = `Merhaba ${leadName}, randevunuz 2 saat sonra başlıyor.`;

  // Add location
  if (appointment.meeting_url) {
    message += ' Online toplantı.';
  } else if (appointment.location) {
    message += ` ${appointment.location}`;
  }

  message += ' Hazır mısınız?';

  return message;
}

/**
 * Format cancellation message
 *
 * Turkish language WhatsApp message for appointment cancellation
 * Includes: lead name, date, time
 */
export function formatCancellationMessage(leadName: string, appointment: Appointment): string {
  const date = formatDate(appointment.scheduled_at);
  const time = formatTime(appointment.scheduled_at);

  return `Merhaba ${leadName}, ${date} saat ${time} randevunuz iptal edildi. Yeni randevu almak için bizimle iletişime geçebilirsiniz.`;
}

/**
 * Format rescheduled message
 *
 * Turkish language WhatsApp message for appointment reschedule
 * Includes: lead name, new date, time, location
 */
export function formatRescheduledMessage(leadName: string, appointment: Appointment): string {
  const date = formatDate(appointment.scheduled_at);
  const time = formatTime(appointment.scheduled_at);

  let message = `Merhaba ${leadName}, randevunuz ${date} saat ${time}'e yeniden planlandı.`;

  // Add location
  if (appointment.meeting_url) {
    message += ' Online toplantı.';
  } else if (appointment.location) {
    message += ` ${appointment.location}`;
  }

  return message;
}
