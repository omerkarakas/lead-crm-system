import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { fetchActiveQuestions } from '@/lib/api/qa';
import { fetchLead } from '@/lib/api/leads';
import { sendQAQuestion, phoneToChatId } from '@/lib/api/whatsapp';
import type { Lead } from '@/types/lead';
import type { QAQuestion } from '@/types/qa';

// Import poll message formatter (for fallback/debugging)
const { formatPollMessage } = require('@/lib/whatsapp/message-formatter');

/**
 * POST /api/leads/[id]/send-poll
 * Manually trigger poll sending for a lead (server-side)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getServerPb();
    const leadId = params.id;

    // Check authentication
    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = pb.authStore.model as any;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Fetch lead
    const lead = await pb.collection('leads').getOne<Lead>(leadId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (lead.qa_completed) {
      return NextResponse.json(
        { error: 'QA already completed for this lead' },
        { status: 400 }
      );
    }

    // Check if already sent
    if (lead.qa_sent) {
      return NextResponse.json(
        { error: 'Poll already sent for this lead' },
        { status: 400 }
      );
    }

    // Fetch active questions
    const questions = await fetchActiveQuestions();
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No active questions found' },
        { status: 400 }
      );
    }

    // Send welcome message
    const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
    const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

    if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
      return NextResponse.json(
        { error: 'Green API credentials not configured' },
        { status: 500 }
      );
    }

    // Format welcome message
    let welcome = `Merhaba ${lead.name || 'Değerli Müşterimiz'}! 🎯\n\n`;
    welcome += `Size daha iyi hizmet verebilmek için ${questions.length} kısa sorumuz var. `;
    welcome += `Her soruyu ayrı bir mesaj olarak göndereceğiz, cevaplarınızı butonları kullanarak seçebilirsiniz.\n\n`;
    welcome += `Başlayalım! 👇`;

    const chatId = phoneToChatId(lead.phone || '');
    const welcomeResponse = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: welcome })
      }
    );

    if (welcomeResponse.ok) {
      const welcomeResult = await welcomeResponse.json();
      await pb.collection('whatsapp_messages').create({
        lead_id: leadId,
        direction: 'outgoing',
        message_text: welcome,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: welcomeResult.idMessage
      });
    }

    // Get the first question (order = 1)
    const firstQuestion = questions.find(q => q.order === 1);

    if (!firstQuestion) {
      return NextResponse.json(
        { error: 'No questions found with order=1' },
        { status: 400 }
      );
    }

    // Send only the first question
    try {
      const result = await sendQAQuestion(lead.phone || '', firstQuestion);

      if (result && result.idMessage) {
        // Log the question message
        await pb.collection('whatsapp_messages').create({
          lead_id: leadId,
          direction: 'outgoing',
          message_text: firstQuestion.question_text,
          message_type: 'poll',
          status: 'sent',
          sent_at: new Date().toISOString(),
          green_api_id: result.idMessage
        });

        // Update lead: qa_sent = true, set current_question_order = 1
        await pb.collection('leads').update(leadId, {
          qa_sent: true,
          qa_sent_at: new Date().toISOString(),
          current_question_order: 1
        });

        console.log('[Send Poll] First question sent successfully for lead:', leadId);

        return NextResponse.json({
          success: true,
          message: 'First question sent, remaining questions will be sent after each answer',
          total: questions.length
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to send first question' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('[Send Poll] Failed to send first question:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send first question' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Send Poll] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send poll' },
      { status: 500 }
    );
  }
}

/**
 * Send poll immediately to a lead (without delay)
 * Updated to use SendPoll for native WhatsApp polls
 */
async function sendPollToLead(leadId: string): Promise<void> {
  const { fetchActiveQuestions } = await import('@/lib/api/qa');
  const { sendQAQuestion, sendWhatsAppMessage, logWhatsAppMessage, phoneToChatId } = await import('@/lib/api/whatsapp');
  const { updateLead } = await import('@/lib/api/leads');
  const pb = await import('pocketbase');

  const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
  const pbInstance = new pb.default(PB_URL);

  // Fetch lead
  const lead = await fetchLead(leadId);
  if (!lead || !lead.phone) {
    throw new Error('Lead not found or no phone');
  }

  // Fetch active questions
  const questions = await fetchActiveQuestions();
  if (questions.length === 0) {
    throw new Error('No active questions found');
  }

  const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
  const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';

  // Send welcome message
  let welcome = `Merhaba ${lead.name || 'Değerli Müşterimiz'}! 🎯\n\n`;
  welcome += `Size daha iyi hizmet verebilmek için ${questions.length} kısa sorumuz var. `;
  welcome += `Her soruyu ayrı bir mesaj olarak göndereceğiz, cevaplarınızı butonları kullanarak seçebilirsiniz.\n\n`;
  welcome += `Başlayalım! 👇`;

  const chatId = phoneToChatId(lead.phone || '');
  const welcomeResponse = await fetch(
    `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: welcome })
    }
  );

  if (welcomeResponse.ok) {
    const welcomeResult = await welcomeResponse.json();
    await logWhatsAppMessage({
      lead_id: leadId,
      direction: 'outgoing',
      message_text: welcome,
      message_type: 'info',
      status: 'sent',
      sent_at: new Date().toISOString(),
      green_api_id: welcomeResult.idMessage
    });
  }

  // Get the first question (order = 1)
  const firstQuestion = questions.find(q => q.order === 1);
  if (!firstQuestion) {
    throw new Error('No questions found with order=1');
  }

  // Send only the first question
  const result = await sendQAQuestion(lead.phone || '', firstQuestion);
  if (result && result.idMessage) {
    await logWhatsAppMessage({
      lead_id: leadId,
      direction: 'outgoing',
      message_text: firstQuestion.question_text,
      message_type: 'poll',
      status: 'sent',
      sent_at: new Date().toISOString(),
      green_api_id: result.idMessage
    });
  }

  // Update lead: qa_sent = true, set current_question_order = 1
  await updateLead(leadId, {
    qa_sent: true,
    qa_sent_at: new Date().toISOString(),
    current_question_order: 1
  });

  console.log('QA first question sent to lead:', leadId);
}
