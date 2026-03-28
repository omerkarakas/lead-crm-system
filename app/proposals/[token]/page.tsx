import { notFound } from 'next/navigation';
import { getServerPb } from '@/lib/pocketbase/server';
import { ProposalView } from '@/components/proposals/ProposalView';
import type { Proposal } from '@/types/proposal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProposalPageProps {
  params: {
    token: string;
  };
}

/**
 * Public proposal viewing page
 * No authentication required - accessed via unique token
 */
export default async function ProposalPage({ params }: ProposalPageProps) {
  const { token } = params;

  // Get proposal by token (includes expiration check)
  const pb = await getServerPb();
  let proposal: Proposal | null = null;

  try {
    proposal = await pb.collection('proposals').getFirstListItem<Proposal>(`token = "${token}"`, {
      expand: 'lead_id,template_id',
    });

    // Check expiration
    const expiresAt = new Date(proposal.expires_at);
    if (expiresAt < new Date()) {
      proposal = null;
    }
  } catch (error) {
    console.error('Get proposal by token error:', error);
    proposal = null;
  }

  // Handle errors
  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Teklif Bulunamadı</h1>
          <p className="text-gray-600 mb-6">
            Bu teklif linki geçersiz veya süresi dolmuş. Lütfen tekrar iletişime geçin.
          </p>
          <a href="https://wa.me/905551234567" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            WhatsApp ile İletişime Geç
          </a>
        </div>
      </div>
    );
  }

  // Check if already responded
  if (proposal.response !== 'cevap_bekleniyor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Teklif Zaten Cevaplanmış</h1>
          <p className="text-gray-600 mb-4">
            Bu teklife daha önce {proposal.response === 'kabul' ? 'kabul' : 'red'} cevabı verdiniz.
          </p>
          {proposal.response_comment && (
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-gray-700 mb-1">Cevapınız:</p>
              <p className="text-gray-600">{proposal.response_comment}</p>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Cevap tarihi: {new Date(proposal.responded_at || '').toLocaleDateString('tr-TR')}
          </p>
        </div>
      </div>
    );
  }

  // Show proposal for viewing and response
  return <ProposalView proposal={proposal} token={token} />;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: ProposalPageProps) {
  const pb = await getServerPb();
  let proposal: Proposal | null = null;

  try {
    proposal = await pb.collection('proposals').getFirstListItem<Proposal>(`token = "${params.token}"`, {
      expand: 'lead_id,template_id',
    });

    // Check expiration
    const expiresAt = new Date(proposal.expires_at);
    if (expiresAt < new Date()) {
      proposal = null;
    }
  } catch (error) {
    proposal = null;
  }

  if (!proposal) {
    return {
      title: 'Teklif Bulunamadı',
    };
  }

  const leadName = proposal.expand?.lead_id?.name || 'Müşteri';
  const templateName = proposal.expand?.template_id?.name || 'Teklif';

  return {
    title: `${templateName} - ${leadName}`,
    description: `Size özel hazırlanmış teklifi inceleyin.`,
  };
}
