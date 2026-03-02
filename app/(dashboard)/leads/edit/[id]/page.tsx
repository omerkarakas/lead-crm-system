'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLeadsStore } from '@/lib/stores/leads';
import { Lead } from '@/types/lead';
import { LeadModal } from '@/components/leads/LeadModal';
import { Loader2 } from 'lucide-react';

interface EditLeadPageProps {
  params: {
    id: string;
  };
}

export default function EditLeadPage({ params }: EditLeadPageProps) {
  const router = useRouter();
  const { fetchLead } = useLeadsStore();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLead = async () => {
      try {
        setLoading(true);
        const fetchedLead = await fetchLead(params.id);
        setLead(fetchedLead);
      } catch (err: any) {
        setError(err.message || 'Lead yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadLead();
  }, [params.id, fetchLead]);

  const handleClose = () => {
    router.push(`/leads/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-destructive">{error || 'Lead bulunamadı'}</p>
      </div>
    );
  }

  return (
    <LeadModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      lead={lead}
      mode="edit"
    />
  );
}
