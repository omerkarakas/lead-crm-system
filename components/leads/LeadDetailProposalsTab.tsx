'use client';

import { useState } from 'react';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import { ProposalHistoryView } from '@/components/proposals/ProposalHistoryView';

interface LeadDetailProposalsTabProps {
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadCompany?: string;
}

export function LeadDetailProposalsTab({
  leadId,
  leadName,
  leadPhone,
  leadCompany,
}: LeadDetailProposalsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewProposal = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    // Refresh proposal list when dialog closes
    if (!open) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Proposal History View with integrated "New Proposal" button */}
      <ProposalHistoryView
        leadId={leadId}
        onNewProposal={handleNewProposal}
        refreshKey={refreshKey}
      />

      {/* Proposal Dialog */}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        leadId={leadId}
        leadName={leadName}
        leadPhone={leadPhone}
        leadCompany={leadCompany}
      />
    </div>
  );
}
