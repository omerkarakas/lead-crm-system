import PocketBase from 'pocketbase';
import { sendEmailToLead } from './email';
import { sendWhatsAppMessage } from './whatsapp';
import { logWhatsAppMessage } from './whatsapp';
import { replaceVariables, type VariableContext } from '@/lib/email/template-variables';
import type { Lead } from '@/types/lead';
import type {
  CampaignEnrollment,
  CampaignStep,
  Sequence,
  SequenceMessage,
  SequenceMessageStatus,
  ExecutionResult,
  StepType,
  DelayType,
} from '@/types/campaign';
import type { WhatsAppMessage, WhatsAppDirection, WhatsAppMessageType, WhatsAppStatus } from '@/types/qa';

// Create dedicated PocketBase instance for sequence execution
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

// -------------------------------------------------------------------------
// Core Execution Functions
// -------------------------------------------------------------------------

/**
 * Start a sequence for an enrollment
 * Creates message record for first step and schedules it
 */
export async function startSequence(
  pbInstance: PocketBase,
  enrollment_id: string
): Promise<ExecutionResult> {
  try {
    // Fetch enrollment with expanded relations
    const enrollment = await pbInstance.collection('campaign_enrollments').getOne<CampaignEnrollment>(
      enrollment_id,
      { expand: 'campaign_id,sequence_id,lead_id' }
    );

    // Fetch sequence to get steps
    const sequence = await pbInstance.collection('sequences').getOne<Sequence>(
      enrollment.sequence_id
    );

    if (!sequence.steps || sequence.steps.length === 0) {
      return {
        success: false,
        error: 'Sequence has no steps'
      };
    }

    // Get first step (assuming steps are sorted by order)
    const firstStep = sequence.steps
      .sort((a, b) => a.order - b.order)
      .find(step => step.type !== 'delay');

    if (!firstStep) {
      return {
        success: false,
        error: 'Sequence has no executable steps (only delays)'
      };
    }

    // Create pending message record for first step
    await createSequenceMessage(pbInstance, enrollment_id, firstStep);

    // If first step is immediate (no delay before it), process it now
    const firstStepInSequence = sequence.steps[0];
    if (firstStepInSequence.type !== 'delay') {
      // Process immediately
      await processNextStep(pbInstance, enrollment_id);
    } else {
      // Schedule based on delay configuration
      const delayMinutes = firstStepInSequence.delay_minutes || 0;
      const nextStepTime = calculateNextStepTime(
        delayMinutes,
        firstStepInSequence.delay_type || 'relative'
      );
      await scheduleNextStep(pbInstance, enrollment_id, nextStepTime);
    }

    return {
      success: true,
      message_id: enrollment_id
    };
  } catch (error: any) {
    console.error('[startSequence] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Process the current step for an enrollment
 */
export async function processNextStep(
  pbInstance: PocketBase,
  enrollment_id: string
): Promise<ExecutionResult> {
  try {
    // Fetch enrollment
    const enrollment = await pbInstance.collection('campaign_enrollments').getOne<CampaignEnrollment>(
      enrollment_id,
      { expand: 'sequence_id,lead_id' }
    );

    if (enrollment.status !== 'active') {
      return {
        success: false,
        error: `Enrollment is not active (status: ${enrollment.status})`
      };
    }

    // Fetch sequence
    const sequence = await pbInstance.collection('sequences').getOne<Sequence>(
      enrollment.sequence_id
    );

    // Get current step
    const currentStep = sequence.steps.find(step => step.order === enrollment.current_step);

    if (!currentStep) {
      // No more steps - complete the enrollment
      await completeEnrollment(pbInstance, enrollment_id);
      return {
        success: true,
        message_id: enrollment_id
      };
    }

    // Execute step with error handling
    const result = await executeStepWithErrorHandling(pbInstance, enrollment, currentStep);

    if (!result.success) {
      // Mark enrollment as failed
      await failEnrollment(pbInstance, enrollment_id, result.error || 'Step execution failed');
      return result;
    }

    // Advance to next step
    await advanceEnrollmentStep(pbInstance, enrollment_id);

    // Schedule next step if there is one
    const nextStep = sequence.steps.find(step => step.order === enrollment.current_step + 1);
    if (nextStep) {
      if (nextStep.type === 'delay') {
        // Calculate delay and schedule
        const delayMinutes = nextStep.delay_minutes || 0;
        const nextStepTime = calculateNextStepTime(
          delayMinutes,
          nextStep.delay_type || 'relative',
          nextStep.scheduled_time
        );

        // Find the step after the delay
        const stepAfterDelay = sequence.steps.find(step => step.order === nextStep.order + 1);
        if (stepAfterDelay) {
          await scheduleNextStep(pbInstance, enrollment_id, nextStepTime);
          // Create pending message for the step after delay
          await createSequenceMessage(pbInstance, enrollment_id, stepAfterDelay);
        } else {
          // Delay is the last step - complete enrollment after delay
          await scheduleNextStep(pbInstance, enrollment_id, nextStepTime);
        }
      } else {
        // Next step is immediate - process it
        await createSequenceMessage(pbInstance, enrollment_id, nextStep);
        await processNextStep(pbInstance, enrollment_id);
      }
    } else {
      // No more steps - complete enrollment
      await completeEnrollment(pbInstance, enrollment_id);
    }

    return {
      success: true,
      message_id: enrollment_id
    };
  } catch (error: any) {
    console.error('[processNextStep] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Send a message based on step type (email or WhatsApp)
 */
async function sendStepMessage(
  pbInstance: PocketBase,
  enrollment: CampaignEnrollment,
  step: CampaignStep
): Promise<ExecutionResult> {
  try {
    // Fetch lead
    const lead = await pbInstance.collection('leads').getOne<Lead>(enrollment.lead_id);

    if (step.type === 'email') {
      return await sendEmailStep(pbInstance, lead, step.template_id, enrollment);
    } else if (step.type === 'whatsapp') {
      return await sendWhatsAppStep(pbInstance, lead, step.template_id, enrollment);
    }

    return {
      success: false,
      error: `Unknown step type: ${step.type}`
    };
  } catch (error: any) {
    console.error('[sendStepMessage] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Schedule the next step time for an enrollment
 */
async function scheduleNextStep(
  pbInstance: PocketBase,
  enrollment_id: string,
  scheduledTime: Date
): Promise<void> {
  await pbInstance.collection('campaign_enrollments').update(enrollment_id, {
    next_step_scheduled: scheduledTime.toISOString()
  });
  console.log('[scheduleNextStep] Scheduled next step for enrollment', enrollment_id, 'at', scheduledTime.toISOString());
}

// -------------------------------------------------------------------------
// Delay Calculation
// -------------------------------------------------------------------------

/**
 * Calculate absolute time for next step
 */
export function calculateNextStepTime(
  delayMinutes: number,
  delayType: DelayType = 'relative',
  scheduledTime?: string
): Date {
  if (delayType === 'absolute' && scheduledTime) {
    // Absolute time - use the provided scheduled time
    return new Date(scheduledTime);
  }

  // Relative delay - add minutes to current time
  const now = new Date();
  return new Date(now.getTime() + delayMinutes * 60 * 1000);
}

/**
 * Convert delay value to minutes based on unit
 */
export function getRelativeDelayMinutes(delayValue: number, delayUnit: string): number {
  switch (delayUnit) {
    case 'minutes':
      return delayValue;
    case 'hours':
      return delayValue * 60;
    case 'days':
      return delayValue * 60 * 24;
    case 'weeks':
      return delayValue * 60 * 24 * 7;
    default:
      return delayValue;
  }
}

/**
 * Validate delay settings for a step
 */
export function validateDelaySettings(step: CampaignStep): { valid: boolean; error?: string } {
  if (step.type !== 'delay') {
    return { valid: true };
  }

  if (step.delay_type === 'relative') {
    if (!step.delay_minutes || step.delay_minutes <= 0) {
      return {
        valid: false,
        error: 'Relative delay must have delay_minutes > 0'
      };
    }
  }

  if (step.delay_type === 'absolute') {
    if (!step.scheduled_time) {
      return {
        valid: false,
        error: 'Absolute delay must have scheduled_time'
      };
    }

    const scheduledDate = new Date(step.scheduled_time);
    if (scheduledDate <= new Date()) {
      return {
        valid: false,
        error: 'Absolute delay time must be in the future'
      };
    }
  }

  return { valid: true };
}

// -------------------------------------------------------------------------
// Template Variable Substitution
// -------------------------------------------------------------------------

/**
 * Substitute variables in template with lead data
 * Supports custom variables (e.g., unsubscribe_link)
 */
function substituteVariables(
  template: string,
  lead: Lead,
  customVars?: Record<string, string>
): string {
  const context: VariableContext = {
    lead,
    customVars
  };

  return replaceVariables(template, context);
}

// -------------------------------------------------------------------------
// Message Sending
// -------------------------------------------------------------------------

/**
 * Send email step
 */
async function sendEmailStep(
  pbInstance: PocketBase,
  lead: Lead,
  templateId?: string,
  enrollment?: CampaignEnrollment
): Promise<ExecutionResult> {
  try {
    if (!lead.email) {
      return {
        success: false,
        error: 'Lead has no email address'
      };
    }

    if (!templateId) {
      return {
        success: false,
        error: 'Email step requires template_id'
      };
    }

    // Prepare custom variables (unsubscribe link)
    const customVars: Record<string, string> = {};
    if (enrollment) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      customVars.unsubscribe_link = `${baseUrl}/unsubscribe/${enrollment.unsubscribe_token}`;
    }

    // Send email
    const result = await sendEmailToLead(lead.id, {
      template_id: templateId,
      customVars
    });

    if (result.success) {
      return {
        success: true,
        message_id: result.messageId
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to send email'
    };
  } catch (error: any) {
    console.error('[sendEmailStep] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Send WhatsApp step
 */
async function sendWhatsAppStep(
  pbInstance: PocketBase,
  lead: Lead,
  templateId?: string,
  enrollment?: CampaignEnrollment
): Promise<ExecutionResult> {
  try {
    if (!lead.phone) {
      return {
        success: false,
        error: 'Lead has no phone number'
      };
    }

    // Format phone number for WhatsApp (needs to be in international format)
    let chatId = lead.phone;
    if (!chatId.startsWith('+')) {
      // Add +90 for Turkey if no country code
      chatId = `+90${chatId.replace(/^0/, '')}`;
    }
    chatId = `${chatId}@c.us`;

    // Get template content if template_id is provided
    let messageText = '';
    if (templateId) {
      try {
        const template = await pbInstance.collection('email_templates').getOne(templateId);
        messageText = template.body;

        // Prepare custom variables (unsubscribe link)
        const customVars: Record<string, string> = {};
        if (enrollment) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          customVars.unsubscribe_link = `${baseUrl}/unsubscribe/${enrollment.unsubscribe_token}`;
        }

        // Substitute variables
        messageText = substituteVariables(messageText, lead, customVars);
      } catch (error) {
        console.warn('[sendWhatsAppStep] Template not found, using empty message');
      }
    }

    if (!messageText) {
      return {
        success: false,
        error: 'No message content (template_id required or template not found)'
      };
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log the message
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing' as WhatsAppDirection,
        message_text: messageText,
        message_type: 'text' as WhatsAppMessageType,
        status: 'sent' as WhatsAppStatus,
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      return {
        success: true,
        message_id: result.idMessage
      };
    }

    return {
      success: false,
      error: 'Failed to send WhatsApp message (Green API not configured)'
    };
  } catch (error: any) {
    console.error('[sendWhatsAppStep] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// -------------------------------------------------------------------------
// Status Tracking
// -------------------------------------------------------------------------

/**
 * Create a pending sequence message record
 */
async function createSequenceMessage(
  pbInstance: PocketBase,
  enrollment_id: string,
  step: CampaignStep
): Promise<SequenceMessage | null> {
  try {
    const message = await pbInstance.collection('sequence_messages').create<SequenceMessage>({
      enrollment_id,
      step_id: step.id,
      step_order: step.order,
      step_type: step.type,
      template_id: step.template_id,
      status: 'pending' as SequenceMessageStatus
    });

    console.log('[createSequenceMessage] Created message record for step', step.id, 'order', step.order);
    return message;
  } catch (error: any) {
    console.error('[createSequenceMessage] Error:', error);
    return null;
  }
}

/**
 * Update sequence message status
 */
async function updateSequenceMessageStatus(
  pbInstance: PocketBase,
  message_id: string,
  status: SequenceMessageStatus,
  error?: string
): Promise<void> {
  try {
    const updateData: Partial<SequenceMessage> = {
      status
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (error) {
      updateData.error_message = error;
    }

    await pbInstance.collection('sequence_messages').update(message_id, updateData);
    console.log('[updateSequenceMessageStatus] Updated message', message_id, 'to', status);
  } catch (error) {
    console.error('[updateSequenceMessageStatus] Error:', error);
  }
}

/**
 * Get execution history for an enrollment
 */
export async function getExecutionHistory(
  pbInstance: PocketBase,
  enrollment_id: string
): Promise<SequenceMessage[]> {
  try {
    const response = await pbInstance.collection('sequence_messages').getList<SequenceMessage>(
      1,
      100,
      {
        filter: `enrollment_id = "${enrollment_id}"`,
        sort: 'step_order'
      }
    );

    return response.items;
  } catch (error: any) {
    console.error('[getExecutionHistory] Error:', error);
    return [];
  }
}

// -------------------------------------------------------------------------
// Error Handling (Fire-and-Forget)
// -------------------------------------------------------------------------

/**
 * Execute step with error handling (fire-and-forget pattern)
 * Logs errors but doesn't throw to prevent cascade failures
 */
async function executeStepWithErrorHandling(
  pbInstance: PocketBase,
  enrollment: CampaignEnrollment,
  step: CampaignStep
): Promise<ExecutionResult> {
  try {
    // Find pending message for this step
    const messages = await pbInstance.collection('sequence_messages').getList<SequenceMessage>(
      1,
      1,
      {
        filter: `enrollment_id = "${enrollment.id}" && step_order = ${step.order}`,
        sort: '-created'
      }
    );

    const messageRecord = messages.items[0];
    if (!messageRecord) {
      return {
        success: false,
        error: 'No pending message record found for this step'
      };
    }

    // Update status to sent
    await updateSequenceMessageStatus(pbInstance, messageRecord.id, 'sent' as SequenceMessageStatus);

    // Send the message
    const result = await sendStepMessage(pbInstance, enrollment, step);

    if (!result.success) {
      // Update status to failed
      await updateSequenceMessageStatus(
        pbInstance,
        messageRecord.id,
        'failed' as SequenceMessageStatus,
        result.error
      );
    }

    return result;
  } catch (error: any) {
    console.error('[executeStepWithErrorHandling] Error:', error);

    // Try to find and update the message record
    try {
      const messages = await pbInstance.collection('sequence_messages').getList<SequenceMessage>(
        1,
        1,
        {
          filter: `enrollment_id = "${enrollment.id}" && step_order = ${step.order}`,
          sort: '-created'
        }
      );

      if (messages.items[0]) {
        await updateSequenceMessageStatus(
          pbInstance,
          messages.items[0].id,
          'failed' as SequenceMessageStatus,
          error.message || 'Unknown error'
        );
      }
    } catch (updateError) {
      console.error('[executeStepWithErrorHandling] Failed to update message status:', updateError);
    }

    // Return failure but don't throw
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

// -------------------------------------------------------------------------
// Helper Functions (imported from enrollments.ts)
// -------------------------------------------------------------------------

/**
 * Advance enrollment to next step
 */
async function advanceEnrollmentStep(
  pbInstance: PocketBase,
  enrollment_id: string
): Promise<CampaignEnrollment> {
  const enrollment = await pbInstance.collection('campaign_enrollments').getOne<CampaignEnrollment>(
    enrollment_id
  );

  const updated = await pbInstance.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      current_step: enrollment.current_step + 1
    }
  );

  console.log('[advanceEnrollmentStep] Advanced enrollment', enrollment_id, 'to step', updated.current_step);

  return updated;
}

/**
 * Mark enrollment as completed
 */
async function completeEnrollment(
  pbInstance: PocketBase,
  enrollment_id: string
): Promise<CampaignEnrollment> {
  const enrollment = await pbInstance.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      status: 'completed',
      completed_at: new Date().toISOString()
    }
  );

  console.log('[completeEnrollment] Completed enrollment', enrollment_id);

  return enrollment;
}

/**
 * Mark enrollment as failed
 */
async function failEnrollment(
  pbInstance: PocketBase,
  enrollment_id: string,
  reason: string
): Promise<CampaignEnrollment> {
  const enrollment = await pbInstance.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      status: 'failed'
    }
  );

  console.log('[failEnrollment] Failed enrollment', enrollment_id, 'reason:', reason);

  return enrollment;
}
