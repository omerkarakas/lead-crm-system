import { getServerPb } from '@/lib/pocketbase/server';
import { getEnrollmentByToken } from '@/lib/api/enrollments';
import { notFound } from 'next/navigation';
import { UnsubscribeForm } from './UnsubscribeForm';
import type { CampaignEnrollment } from '@/types/campaign';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UnsubscribePageProps {
  params: {
    token: string;
  };
}

/**
 * Public unsubscribe page
 * No authentication required - accessed via unsubscribe token
 */
export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const pb = await getServerPb();

  // Validate token and fetch enrollments
  const enrollment = await getEnrollmentByToken(pb, params.token);

  if (!enrollment) {
    notFound();
  }

  const lead = enrollment.expand?.lead_id;

  if (!lead) {
    notFound();
  }

  // Get all active enrollments for this lead
  const response = await pb.collection('campaign_enrollments').getList(1, 100, {
    filter: `lead_id = "${enrollment.lead_id}" && status = "active"`,
    expand: 'campaign_id',
  });

  const activeEnrollments = response.items as unknown as CampaignEnrollment[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              E-posta Bildirimlerini Yönet
            </h1>
            <p className="text-gray-600">
              Hangi e-posta kampanyalarından ayrılmak istersiniz?
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong className="font-semibold">{lead.name}</strong> ({lead.email}) hesabı için aşağıdaki kampanyalara kayıtlısınız.
            </p>
          </div>

          <UnsubscribeForm
            token={params.token}
            activeEnrollments={activeEnrollments}
            leadName={lead.name}
          />
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Bu sayfayı bir e-postadaki bağlantı aracılığıyla ulaştınız.</p>
          <p className="mt-1">Herhangi bir sorununuz varsa, lütfen bizimle iletişime geçin.</p>
        </div>
      </div>
    </div>
  );
}
