import pb from '@/lib/pocketbase';
import type {
  ProposalTemplate,
  CreateProposalTemplateDto,
  UpdateProposalTemplateDto,
  TemplateVariable,
} from '@/types/proposal';
import type { Lead } from '@/types/lead';
import type { Appointment } from '@/types/proposal';

/**
 * Default available variables for proposal templates
 */
export const availableVariables: TemplateVariable[] = [
  { name: 'name', label: 'İsim', description: 'Lead adı' },
  { name: 'company', label: 'Şirket', description: 'Lead şirketi' },
  { name: 'phone', label: 'Telefon', description: 'Lead telefonu' },
  { name: 'email', label: 'E-posta', description: 'Lead e-posta' },
  { name: 'website', label: 'Website', description: 'Lead websitesi' },
  { name: 'message', label: 'Mesaj', description: 'Lead mesajı' },
  { name: 'budget', label: 'Bütçe', description: 'Proje bütçesi' },
  { name: 'appointment_date', label: 'Randevu Tarihi', description: 'Randevu tarihi' },
  { name: 'appointment_time', label: 'Randevu Saati', description: 'Randevu saati' },
];

/**
 * Fetch all templates (not deleted)
 */
export async function getProposalTemplates(filters?: {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}): Promise<{ items: ProposalTemplate[]; totalItems: number; totalPages: number }> {
  const page = filters?.page || 1;
  const perPage = filters?.perPage || 50;

  let filter = 'is_deleted = false';

  if (filters?.isActive !== undefined) {
    filter += ` && is_active = ${filters.isActive}`;
  }

  if (filters?.search) {
    filter += ` && (name ~ "${filters.search}" || description ~ "${filters.search}")`;
  }

  const response = await pb.collection('proposal_templates').getList<ProposalTemplate>(page, perPage, {
    filter,
    sort: '-created',
  });

  return {
    items: response.items,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
  };
}

/**
 * Fetch only archived templates (deleted)
 */
export async function getArchivedProposalTemplates(): Promise<ProposalTemplate[]> {
  const response = await pb.collection('proposal_templates').getList<ProposalTemplate>(1, 100, {
    filter: 'is_deleted = true',
    sort: '-updated',
  });

  return response.items;
}

/**
 * Fetch only active templates (is_active=true AND is_deleted=false)
 */
export async function getActiveProposalTemplates(): Promise<ProposalTemplate[]> {
  const response = await pb.collection('proposal_templates').getList<ProposalTemplate>(1, 100, {
    filter: 'is_active = true && is_deleted = false',
    sort: 'name',
  });

  return response.items;
}

/**
 * Fetch a single template by ID
 */
export async function getProposalTemplateById(id: string): Promise<ProposalTemplate> {
  return await pb.collection('proposal_templates').getOne<ProposalTemplate>(id);
}

/**
 * Create a new proposal template
 */
export async function createProposalTemplate(
  data: CreateProposalTemplateDto
): Promise<ProposalTemplate> {
  const record = await pb.collection('proposal_templates').create<ProposalTemplate>({
    name: data.name,
    description: data.description || '',
    content: data.content,
    editor_type: data.editor_type || 'tiptap',
    variables: data.variables || [],
    is_active: data.is_active ?? true,
    is_deleted: false,
  });

  return record;
}

/**
 * Update an existing proposal template
 */
export async function updateProposalTemplate(
  id: string,
  data: UpdateProposalTemplateDto
): Promise<ProposalTemplate> {
  return await pb.collection('proposal_templates').update<ProposalTemplate>(id, data);
}

/**
 * Delete (soft delete) a proposal template
 */
export async function deleteProposalTemplate(id: string): Promise<ProposalTemplate> {
  return await pb.collection('proposal_templates').update<ProposalTemplate>(id, {
    is_deleted: true,
  });
}

/**
 * Restore a deleted proposal template
 */
export async function restoreProposalTemplate(id: string): Promise<ProposalTemplate> {
  return await pb.collection('proposal_templates').update<ProposalTemplate>(id, {
    is_deleted: false,
  });
}

/**
 * Toggle template active status
 */
export async function toggleProposalTemplateActive(
  id: string,
  isActive: boolean
): Promise<ProposalTemplate> {
  return await updateProposalTemplate(id, { is_active: isActive });
}

/**
 * Toggle template active status (alias for consistency)
 */
export async function toggleActive(id: string, isActive: boolean): Promise<ProposalTemplate> {
  return await toggleProposalTemplateActive(id, isActive);
}

/**
 * Replace template variables with actual data
 * Supports both {{variable}} and {variable} syntax
 */
function replaceTemplateVariables(
  text: string,
  lead: Lead,
  appointment?: Appointment,
  customVariables?: Record<string, string>
): string {
  let result = text;

  // Replace default lead variables
  result = result.replace(/\{\{name\}\}/g, lead.name || '');
  result = result.replace(/\{name\}/g, lead.name || '');

  result = result.replace(/\{\{email\}\}/g, lead.email || '');
  result = result.replace(/\{email\}/g, lead.email || '');

  result = result.replace(/\{\{phone\}\}/g, lead.phone || '');
  result = result.replace(/\{phone\}/g, lead.phone || '');

  result = result.replace(/\{\{company\}\}/g, lead.company || '');
  result = result.replace(/\{company\}/g, lead.company || '');

  result = result.replace(/\{\{website\}\}/g, lead.website || '');
  result = result.replace(/\{website\}/g, lead.website || '');

  result = result.replace(/\{\{message\}\}/g, lead.message || '');
  result = result.replace(/\{message\}/g, lead.message || '');

  // Replace appointment variables if available
  if (appointment) {
    const appointmentDate = new Date(appointment.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('tr-TR');
    const formattedTime = appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    result = result.replace(/\{\{appointment_date\}\}/g, formattedDate);
    result = result.replace(/\{appointment_date\}/g, formattedDate);

    result = result.replace(/\{\{appointment_time\}\}/g, formattedTime);
    result = result.replace(/\{appointment_time\}/g, formattedTime);
  }

  // Replace custom variables
  if (customVariables) {
    Object.entries(customVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
    });
  }

  return result;
}

/**
 * Preview template with sample data
 */
export function previewTemplate(
  template: ProposalTemplate,
  customVariables?: Record<string, string>
): string {
  const sampleLead: Lead = {
    id: 'sample-lead-id',
    name: 'Ahmet Yılmaz',
    phone: '+905551234567',
    email: 'ahmet@example.com',
    company: 'Örnek Şirket A.Ş.',
    website: 'https://ornek-sirket.com',
    message: 'Örnek mesaj içeriği',
    source: 'manual' as any,
    status: 'new' as any,
    score: 0,
    quality: 'pending' as any,
    tags: [],
    qa_sent: false,
    qa_completed: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  const sampleAppointment: Appointment = {
    id: 'sample-appointment-id',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),
    status: 'scheduled',
  };

  return replaceTemplateVariables(template.content, sampleLead, sampleAppointment, customVariables);
}

/**
 * Fill template with actual lead data
 */
export async function fillTemplate(
  template: ProposalTemplate,
  lead: Lead,
  appointment?: Appointment,
  customVariables?: Record<string, string>
): Promise<string> {
  return replaceTemplateVariables(template.content, lead, appointment, customVariables);
}

/**
 * Substitute variables in template content
 * Used for preview and actual proposal generation
 * @deprecated Use fillTemplate or previewTemplate instead
 */
export function substituteTemplateVariables(
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
