import type { SendEmailDto, ResendResponse, ResendErrorResponse } from '@/types/email';

/**
 * Send email using Resend API
 */
export async function sendEmail(data: SendEmailDto): Promise<ResendResponse> {
  const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Moka CRM <info@mokacrm.com>',
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
    }),
  });

  if (!response.ok) {
    const error: ResendErrorResponse = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to send email: ${response.statusText}`);
  }

  return await response.json();
}
