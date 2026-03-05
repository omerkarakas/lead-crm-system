'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ExternalLink, Plus } from 'lucide-react';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import {
  formatProposalResponse,
  getProposalResponseBadgeVariant,
} from '@/lib/utils/proposal';
import type { Proposal } from '@/types/proposal';

interface AppointmentDetailProposalTabProps {
  appointmentId: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadCompany?: string;
}

export function AppointmentDetailProposalTab({
  appointmentId,
  leadId,
  leadName,
  leadPhone,
  leadCompany,
}: AppointmentDetailProposalTabProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadProposals = async () => {
    if (!leadId) {
      setProposals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/proposals?leadId=${leadId}`);
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadProposals, 30000);
    return () => clearInterval(interval);
  }, [leadId]);

  const handleProposalSent = () => {
    loadProposals();
  };

  if (!leadId) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          Bu randevu bir lead ile ilişkili değil, teklif gönderilemez.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Teklifler</h3>
          <p className="text-sm text-gray-600">
            {proposals.length} teklif
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Teklif
        </Button>
      </div>

      {/* Proposals Table */}
      {proposals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Henüz teklif gönderilmedi</p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            İlk Teklifi Gönder
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Şablon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Geçerlilik</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    {new Date(proposal.created).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    {proposal.expand?.template_id?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getProposalResponseBadgeVariant(proposal.response)}>
                      {formatProposalResponse(proposal.response)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(proposal.expires_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/proposals/${proposal.token}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Proposal Dialog */}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            handleProposalSent();
          }
        }}
        leadId={leadId}
        leadName={leadName || 'Müşteri'}
        leadPhone={leadPhone}
        leadCompany={leadCompany}
      />
    </div>
  );
}
