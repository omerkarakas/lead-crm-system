'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, CheckCircle2, XCircle, Loader2, Calendar, Plus } from 'lucide-react';
import {
  formatProposalResponse,
  getProposalResponseBadgeVariant,
  getProposalResponseBadgeClass,
} from '@/lib/utils/proposal';
import type { Proposal, ProposalResponse } from '@/types/proposal';

interface ProposalHistoryViewProps {
  leadId: string;
  onNewProposal?: () => void;
  refreshKey?: number;
}

type ResponseFilter = 'all' | 'cevap_bekleniyor' | 'kabul' | 'red';
type SortOrder = 'newest' | 'oldest';

export function ProposalHistoryView({ leadId, onNewProposal, refreshKey }: ProposalHistoryViewProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ResponseFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const loadProposals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        leadId,
        sort: sortOrder,
      });

      if (filter !== 'all') {
        params.set('response', filter);
      }

      const response = await fetch(`/api/proposals?${params.toString()}`);
      const data = await response.json();
      setProposals(data.items || []);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [leadId, filter, sortOrder, refreshKey]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(loadProposals, 30000);
    return () => clearInterval(interval);
  }, [leadId, filter, sortOrder]);

  const getResponseIcon = (response: ProposalResponse) => {
    switch (response) {
      case 'kabul':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'red':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Teklif Geçmişi</h3>
          <p className="text-sm text-gray-600">{proposals.length} teklif</p>
        </div>
        <div className="flex items-center gap-3">
          {onNewProposal && (
            <Button onClick={onNewProposal} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Teklif
            </Button>
          )}
          <Select value={filter} onValueChange={(value) => setFilter(value as ResponseFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="cevap_bekleniyor">Bekleyen</SelectItem>
              <SelectItem value="kabul">Kabul</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Yeniden Eskiye</SelectItem>
              <SelectItem value="oldest">Eskiden Yeniye</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proposals Timeline */}
      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Henüz teklif gönderilmedi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal, index) => (
            <div
              key={proposal.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Timeline connector for items after the first */}
              {index > 0 && <div className="hidden sm:block absolute left-6 -mt-6 w-0.5 h-6 bg-gray-200" />}

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      proposal.response === 'kabul'
                        ? 'bg-green-100 text-green-600'
                        : proposal.response === 'red'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {getResponseIcon(proposal.response)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {proposal.expand?.template_id?.name || 'Teklif'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(proposal.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getProposalResponseBadgeVariant(proposal.response)}
                        className={getProposalResponseBadgeClass(proposal.response)}
                      >
                        {formatProposalResponse(proposal.response)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/proposals/${proposal.token}`, '_blank')}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Response Details */}
                  {proposal.response !== 'cevap_bekleniyor' && proposal.responded_at && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Cevap Tarihi:</span>
                        <span className="text-gray-600">{formatDate(proposal.responded_at)}</span>
                      </div>
                      {proposal.response_comment && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <span className="font-medium text-gray-700">Gerekçe:</span>
                          <span className="text-gray-600 flex-1">{proposal.response_comment}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expiration Info */}
                  {proposal.response === 'cevap_bekleniyor' && (
                    <div className="mt-2 text-sm text-gray-500">
                      Son geçerlilik: {formatDate(proposal.expires_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
