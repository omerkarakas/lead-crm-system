'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getActiveProposalTemplates } from '@/lib/api/proposal-templates';
import type { ProposalTemplate } from '@/types/proposal';

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadCompany?: string;
}

export function ProposalDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
  leadCompany,
}: ProposalDialogProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load active templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const activeTemplates = await getActiveProposalTemplates();
      setTemplates(activeTemplates);
      if (activeTemplates.length > 0) {
        setSelectedTemplateId(activeTemplates[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Şablonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSendProposal = async () => {
    if (!selectedTemplateId) {
      setError('Lütfen bir şablon seçin');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          template_id: selectedTemplateId,
          variables: customVariables,
          expires_in_days: 3,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Teklif gönderilemedi');
      }

      setSuccess(true);

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setSelectedTemplateId('');
        setCustomVariables({});
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Get default variables preview
  const defaultVariables: Record<string, string> = {
    name: leadName,
    company: leadCompany || '',
    phone: leadPhone || '',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Teklif Gönder</DialogTitle>
          <DialogDescription>
            {leadName} için bir şablon seçin ve teklifi WhatsApp ile gönderin.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Teklif Gönderildi!
            </h3>
            <p className="text-gray-600 text-center">
              Teklif {leadName} için WhatsApp ile gönderildi.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Teklif Şablonu *</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Description */}
            {selectedTemplate?.description && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
            )}

            {/* Variable Preview */}
            <div className="space-y-2">
              <Label>Dolacak Değişkenler</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium text-gray-700">İsim:</span>
                  <span className="text-gray-900">{leadName}</span>

                  {leadCompany && (
                    <>
                      <span className="font-medium text-gray-700">Şirket:</span>
                      <span className="text-gray-900">{leadCompany}</span>
                    </>
                  )}

                  {leadPhone && (
                    <>
                      <span className="font-medium text-gray-700">Telefon:</span>
                      <span className="text-gray-900">{leadPhone}</span>
                    </>
                  )}
                </div>

                {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                  <div className="pt-2 border-t border-blue-200 mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Ek Değişkenler:</p>
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.name} className="space-y-1">
                        <Label className="text-xs" htmlFor={`var-${variable.name}`}>
                          {variable.label}
                          {variable.description && ` (${variable.description})`}
                        </Label>
                        <Textarea
                          id={`var-${variable.name}`}
                          placeholder={variable.default_value || `${variable.label} girin...`}
                          value={customVariables[variable.name] || ''}
                          onChange={(e) =>
                            setCustomVariables({
                              ...customVariables,
                              [variable.name]: e.target.value,
                            })
                          }
                          className="min-h-[60px] text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!loading && !success && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={handleSendProposal}
                disabled={sending || !selectedTemplateId}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  'WhatsApp ile Gönder'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
