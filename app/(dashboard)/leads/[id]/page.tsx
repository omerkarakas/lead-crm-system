import { fetchLead } from '@/lib/api/leads';
import { Lead } from '@/types/lead';
import { notFound } from 'next/navigation';
import { LeadInfo } from '@/components/leads/LeadInfo';
import { NotesSection } from '@/components/leads/NotesSection';
import { TagsManager } from '@/components/leads/TagsManager';
import { LeadDetailActions } from '@/components/leads/LeadDetailActions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

async function getLead(id: string): Promise<Lead> {
  try {
    return await fetchLead(id);
  } catch (error) {
    notFound();
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const lead = await getLead(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
            <p className="text-muted-foreground">
              {lead.company || 'Müşteri Adayı Detayı'}
            </p>
          </div>
        </div>
        <LeadDetailActions leadId={lead.id} leadName={lead.name} lead={lead} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadInfo lead={lead} />
          <NotesSection leadId={lead.id} />
        </div>
        <div className="space-y-6">
          <TagsManager leadId={lead.id} currentTags={lead.tags} />
        </div>
      </div>
    </div>
  );
}
