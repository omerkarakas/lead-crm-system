import pb from '@/lib/pocketbase';
import type {
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
} from '@/types/email';
import { sendEmail } from '@/lib/api/email';
import type { Lead } from '@/types/lead';

/**
 * Fetch all active templates (not deleted)
 */
export async function fetchTemplates(): Promise<EmailTemplate[]> {
  const response = await pb.collection('email_templates').getList<EmailTemplate>(1, 100, {
    filter: 'is_deleted = false',
    sort: 'category, name',
  });

  return response.items;
}

/**
 * Fetch only archived templates (deleted)
 */
export async function fetchArchivedTemplates(): Promise<EmailTemplate[]> {
  const response = await pb.collection('email_templates').getList<EmailTemplate>(1, 100, {
    filter: 'is_deleted = true',
    sort: '-updated',
  });

  return response.items;
}

/**
 * Fetch only active templates (is_active=true AND is_deleted=false)
 */
export async function fetchActiveTemplates(): Promise<EmailTemplate[]> {
  const response = await pb.collection('email_templates').getList<EmailTemplate>(1, 100, {
    filter: 'is_active = true && is_deleted = false',
    sort: 'category, name',
  });

  return response.items;
}

/**
 * Fetch a single template by ID
 */
export async function fetchTemplateById(id: string): Promise<EmailTemplate> {
  return await pb.collection('email_templates').getOne<EmailTemplate>(id);
}

/**
 * Get unique list of all categories
 */
export async function fetchCategories(): Promise<string[]> {
  const response = await pb.collection('email_templates').getList<EmailTemplate>(1, 500, {
    filter: 'is_deleted = false',
  });

  // Extract unique categories
  const categories = new Set<string>();
  response.items.forEach((template) => {
    if (template.category) {
      categories.add(template.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Create a new template
 */
export async function createTemplate(data: CreateEmailTemplateDto): Promise<EmailTemplate> {
  const record = await pb.collection('email_templates').create<EmailTemplate>({
    name: data.name,
    subject: data.subject,
    body: data.body,
    category: data.category || 'generic',
    is_active: data.is_active ?? true,
    is_deleted: false,
  });

  return record;
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, data: UpdateEmailTemplateDto): Promise<EmailTemplate> {
  return await pb.collection('email_templates').update<EmailTemplate>(id, data);
}

/**
 * Archive a template (soft delete - set is_deleted=true)
 */
export async function archiveTemplate(id: string): Promise<EmailTemplate> {
  return await pb.collection('email_templates').update<EmailTemplate>(id, {
    is_deleted: true,
  });
}

/**
 * Restore a template (set is_deleted=false)
 */
export async function restoreTemplate(id: string): Promise<EmailTemplate> {
  return await pb.collection('email_templates').update<EmailTemplate>(id, {
    is_deleted: false,
  });
}

/**
 * Toggle template active status
 */
export async function toggleTemplateActive(id: string, isActive: boolean): Promise<EmailTemplate> {
  return await updateTemplate(id, { is_active: isActive });
}

/**
 * Send test email using template
 */
export async function sendTestEmail(
  templateId: string,
  testEmailAddress: string
): Promise<void> {
  // Fetch template
  const template = await fetchTemplateById(templateId);

  // Create sample lead data for variable substitution
  const sampleLead: Lead = {
    id: 'sample-lead-id',
    name: 'Ahmet Yılmaz',
    phone: '+905551234567',
    email: testEmailAddress,
    company: 'Örnek Şirket A.Ş.',
    website: 'https://ornek-sirket.com',
    message: 'Örnek mesaj içeriği',
    source: 'web_form' as const,
    status: 'new' as const,
    score: 0,
    quality: 'pending' as const,
    tags: [],
    qa_sent: false,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  // Replace variables in subject and body
  const subject = replaceTemplateVariables(template.subject, sampleLead);
  const body = replaceTemplateVariables(template.body, sampleLead);

  // Send email
  await sendEmail({
    to: testEmailAddress,
    subject: subject,
    html: body,
  });
}

/**
 * Replace template variables with actual data
 * Supported variables: {{name}}, {{email}}, {{phone}}, {{company}}, {{website}}, {{message}}
 */
function replaceTemplateVariables(text: string, lead: Lead): string {
  let result = text;

  // Replace all supported variables
  result = result.replace(/\{\{name\}\}/g, lead.name || '');
  result = result.replace(/\{\{email\}\}/g, lead.email || '');
  result = result.replace(/\{\{phone\}\}/g, lead.phone || '');
  result = result.replace(/\{\{company\}\}/g, lead.company || '');
  result = result.replace(/\{\{website\}\}/g, lead.website || '');
  result = result.replace(/\{\{message\}\}/g, lead.message || '');

  return result;
}
