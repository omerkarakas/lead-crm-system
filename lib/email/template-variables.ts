import type { Lead } from '@/types/lead';
import type { LeadSource, LeadStatus } from '@/types/lead';

/**
 * Turkish translations for lead sources
 */
const SOURCE_TURKISH_MAP: Record<LeadSource, string> = {
  web_form: 'Web Formu',
  api: 'API',
  manual: 'Manuel',
  whatsapp: 'WhatsApp'
};

/**
 * Turkish translations for lead statuses
 */
const STATUS_TURKISH_MAP: Record<LeadStatus, string> = {
  new: 'Yeni',
  qualified: 'Qualify',
  booked: 'Randevu Alındı',
  customer: 'Müşteri',
  lost: 'Kayıp',
  're-apply': 'Tekrar Başvuru'
};

/**
 * Get variable value from lead data
 */
export function getVariableValue(variable: string, lead: Lead): string {
  switch (variable) {
    case 'name':
      return lead.name || '';

    case 'first_name':
      return lead.name ? lead.name.split(' ')[0] : '';

    case 'company':
      return lead.company || '';

    case 'email':
      return lead.email || '';

    case 'phone':
      return lead.phone || '';

    case 'website':
      return lead.website || '';

    case 'message':
      return lead.message || '';

    case 'source':
      return SOURCE_TURKISH_MAP[lead.source] || lead.source;

    case 'status':
      return STATUS_TURKISH_MAP[lead.status] || lead.status;

    default:
      return '';
  }
}

/**
 * Replace template variables with lead data
 * Supports {{variable}} syntax
 */
export function replaceVariables(template: string, lead: Lead): string {
  // Find all {{variable}} patterns and replace them
  return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = getVariableValue(variableName, lead);
    return value !== '' ? value : match;
  });
}

/**
 * Extract all variable names from a template
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
}
