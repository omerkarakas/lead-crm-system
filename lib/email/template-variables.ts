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
 * Variable replacement context
 * Includes lead data and optional custom variables
 */
export interface VariableContext {
  lead: Lead;
  customVars?: Record<string, string>;
}

/**
 * Get variable value from lead data or custom variables
 */
export function getVariableValue(variable: string, context: VariableContext): string {
  const { lead, customVars } = context;

  // Check custom variables first
  if (customVars && variable in customVars) {
    return customVars[variable];
  }

  // Lead data variables
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
 * Supports {variable} syntax
 * Can also accept custom variables (like unsubscribe_link)
 */
export function replaceVariables(template: string, context: VariableContext): string {
  // Find all {variable} patterns and replace them
  return template.replace(/\{(\w+)\}/g, (match, variableName) => {
    const value = getVariableValue(variableName, context);
    return value !== '' ? value : match;
  });
}

/**
 * Replace template variables with lead data (legacy signature)
 * @deprecated Use replaceVariables with VariableContext instead
 */
export function replaceVariablesLegacy(template: string, lead: Lead): string {
  return replaceVariables(template, { lead });
}

/**
 * Extract all variable names from a template
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return matches.map(match => match.replace(/\{|\}/g, ''));
}
