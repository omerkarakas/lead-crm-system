import type { Lead } from '@/types/lead';
import type { Appointment } from '@/types/appointment';

/**
 * Substitute variables in template content
 * Replaces {variable} with actual values
 */
export function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  // Replace all variables in the format {variable_name}
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    const value = variables[key] || '';
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });

  return result;
}

/**
 * Generate unique random token for proposal link
 */
export function generateProposalToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate full URL for proposal viewing
 */
export function generateProposalLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/proposals/${token}`;
}

/**
 * Calculate expiration date from now
 */
export function calculateExpirationDate(days: number = 3): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Extract variables from lead for template filling
 * Returns default variables that can be used in templates
 */
export function getLeadVariables(
  lead: Lead,
  appointment?: Appointment
): Record<string, string> {
  const variables: Record<string, string> = {
    name: lead.name || '',
    company: lead.company || '',
    phone: lead.phone || '',
    email: lead.email || '',
    website: lead.website || '',
    message: lead.message || '',
  };

  // Add appointment variables if provided
  if (appointment) {
    const startDate = new Date(appointment.scheduled_at);
    const endDate = new Date(appointment.scheduled_at);
    if (appointment.duration) {
      endDate.setTime(endDate.getTime() + appointment.duration * 60000);
    }

    variables.appointment_date = formatDate(startDate);
    variables.appointment_time = formatTime(startDate);
    variables.appointment_end_time = formatTime(endDate);
    variables.appointment_status = appointment.status || '';
  }

  return variables;
}

/**
 * Format date in Turkish format
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time in Turkish format
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if proposal is expired
 */
export function isProposalExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Format proposal response for display
 */
export function formatProposalResponse(response: string): string {
  switch (response) {
    case 'cevap_bekleniyor':
      return 'Cevap Bekleniyor';
    case 'kabul':
      return 'Kabul';
    case 'red':
      return 'Red';
    default:
      return response;
  }
}

/**
 * Get badge color variant for proposal response
 */
export function getProposalResponseBadgeVariant(response: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (response) {
    case 'cevap_bekleniyor':
      return 'outline';
    case 'kabul':
      return 'secondary'; // Use secondary instead of success
    case 'red':
      return 'destructive';
    default:
      return 'default';
  }
}

/**
 * Get badge custom class for proposal response (for special colors)
 */
export function getProposalResponseBadgeClass(response: string): string {
  switch (response) {
    case 'cevap_bekleniyor':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    case 'kabul':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    default:
      return '';
  }
}
