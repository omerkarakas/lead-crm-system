'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Proposal } from '@/types/proposal';

interface ProposalViewProps {
  proposal: Proposal;
  token: string;
}

export function ProposalView({ proposal, token }: ProposalViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<'kabul' | 'red' | null>(null);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (selectedResponse: 'kabul' | 'red') => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/proposals/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          response: selectedResponse,
          comment: selectedResponse === 'red' ? comment : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Cevap gönderilemedi');
      }

      setSuccess(true);
      setResponse(selectedResponse);

      // Refresh after 2 seconds
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            response === 'kabul' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {response === 'kabul' ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            response === 'kabul' ? 'text-green-600' : 'text-red-600'
          }`}>
            {response === 'kabul' ? 'Teklif Kabul Edildi!' : 'Teklif Reddedildi'}
          </h1>
          <p className="text-gray-600">
            {response === 'kabul'
              ? 'Teşekkür ederiz! En kısa sürede sizinle iletişime geçeceğiz.'
              : 'Geri bildiriminiz için teşekkür ederiz.'}
          </p>
        </div>
      </div>
    );
  }

  const lead = proposal.expand?.lead_id;
  const template = proposal.expand?.template_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {template?.name || 'Teklif'}
          </h1>
          {template?.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
          {lead && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Hazırlanan:</span> {lead.name}
                {lead.company && ` - ${lead.company}`}
              </p>
            </div>
          )}
        </div>

        {/* Proposal Content */}
        <div className="bg-white shadow-sm rounded-lg p-8 mb-6 prose max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: proposal.filled_content,
            }}
          />
        </div>

        {/* Expiration Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Önemli:</strong> Bu teklif linki{' '}
            {new Date(proposal.expires_at).toLocaleDateString('tr-TR')} tarihine kadar geçerlidir.
          </p>
        </div>

        {/* Response Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Teklife Cevap Verin</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-700">
              Bu teklifi kabul ediyor musunuz?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSubmit('kabul')}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Gönderiliyor...' : 'Kabul Et'}
              </button>
              <button
                onClick={() => {
                  if (!comment.trim()) {
                    setError('Red nedeni için lütfen bir açıklama yazın.');
                    return;
                  }
                  handleSubmit('red');
                }}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Gönderiliyor...' : 'Reddet'}
              </button>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Red Nedeni (opsiyonel)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Teklifi neden reddettiğiniz kısaca açıklayın..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Sorularınız için bize WhatsApp üzerinden ulaşabilirsiniz:</p>
          <a
            href="https://wa.me/905551234567"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            WhatsApp ile İletişime Geç
          </a>
        </div>
      </div>
    </div>
  );
}
