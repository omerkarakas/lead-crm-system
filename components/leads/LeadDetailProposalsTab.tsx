'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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

  const handleNewProposal = () => {
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Proposal History View with integrated "New Proposal" button */}
      <ProposalHistoryView leadId={leadId} onNewProposal={handleNewProposal} />

      {/* Proposal Dialog */}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
        leadId={leadId}
        leadName={leadName}
        leadPhone={leadPhone}
        leadCompany={leadCompany}
      />
    </div>
  );
}
