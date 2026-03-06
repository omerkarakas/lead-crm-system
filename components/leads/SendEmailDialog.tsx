'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchActiveTemplates, fetchTemplateById } from '@/lib/api/email-templates';
import { useEmailStore } from '@/lib/stores/email';
import { replaceVariables } from '@/lib/email/template-variables';
import type { Lead } from '@/types/lead';
import type { EmailTemplate as EmailTemplateType } from '@/types/email';
import { Mail, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SendEmailDialogProps {
  leadId: string;
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SendEmailDialog({
  leadId,
  lead,
  open,
  onOpenChange,
  onSuccess,
}: SendEmailDialogProps) {
  const { lastUsedTemplateId, setLastUsedTemplate } = useEmailStore();

  const [templates, setTemplates] = useState<EmailTemplateType[]>([]);
  const [lastUsedTemplate, setLastUsedTemplateState] = useState<EmailTemplateType | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const [activeTemplates, lastTemplateId] = await Promise.all([
          fetchActiveTemplates(),
          // In a real app, we'd call getLastUsedTemplate API here
          Promise.resolve(lastUsedTemplateId),
        ]);

        setTemplates(activeTemplates);

        if (lastTemplateId) {
          try {
            const template = await fetchTemplateById(lastTemplateId);
            setLastUsedTemplateState(template);
          } catch {
            // Template may have been deleted
            setLastUsedTemplateState(null);
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Şablonlar yüklenirken hata oluştu');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    if (open) {
      loadTemplates();
    }
  }, [open, lastUsedTemplateId]);

  // Update preview when subject, body, or lead changes
  useEffect(() => {
    const fullHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${subject ? `<h2 style="color: #333; margin-bottom: 16px;">${replaceVariables(subject, lead)}</h2>` : ''}
        <div style="color: #555; line-height: 1.6;">
          ${body ? replaceVariables(body, lead) : '<em style="color: #999;">E-posta içeriği burada görünecek...</em>'}
        </div>
      </div>
    `;
    setPreviewHtml(fullHtml);
  }, [subject, body, lead]);

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplateId(templateId);

    if (templateId === 'custom') {
      setSubject('');
      setBody('');
      return;
    }

    try {
      const template = await fetchTemplateById(templateId);
      setSubject(template.subject);
      setBody(template.body);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Şablon yüklenirken hata oluştu');
    }
  };

  // Handle quick send
  const handleQuickSend = async () => {
    if (!lastUsedTemplate) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          template_id: lastUsedTemplate.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLastUsedTemplate(lastUsedTemplate.id);
        toast.success('E-posta başarıyla gönderildi');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'E-posta gönderilirken hata oluştu');
      }
    } catch (error: any) {
      toast.error(error.message || 'E-posta gönderilirken hata oluştu');
    } finally {
      setIsSending(false);
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Lütfen konu ve içerik alanlarını doldurun');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          subject,
          body,
          template_id: selectedTemplateId || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (selectedTemplateId && selectedTemplateId !== 'custom') {
          setLastUsedTemplate(selectedTemplateId);
        }
        toast.success('E-posta başarıyla gönderildi');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'E-posta gönderilirken hata oluştu');
      }
    } catch (error: any) {
      toast.error(error.message || 'E-posta gönderilirken hata oluştu');
    } finally {
      setIsSending(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedTemplateId(null);
      setSubject('');
      setBody('');
      setPreviewHtml('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-posta Gönder
          </DialogTitle>
          <DialogDescription>
            {lead.name} için e-posta gönderin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Send Button */}
          {lastUsedTemplate && !isLoadingTemplates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Button
                onClick={handleQuickSend}
                disabled={isSending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Hızlı Gönder: {lastUsedTemplate.name}
                  </>
                )}
              </Button>
              <p className="text-xs text-blue-600 mt-2 text-center">
                Son kullanılan şablonla tek tıkla gönder
              </p>
            </div>
          )}

          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Şablon</Label>
            <Select
              value={selectedTemplateId || ''}
              onValueChange={handleTemplateSelect}
              disabled={isLoadingTemplates || isSending}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Şablon seçin veya manuel girin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Özel (Manuel)</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.category && (
                      <span className="ml-2 text-muted-foreground">
                        ({template.category})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variable Hint */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground flex flex-wrap gap-1">
              <strong>Kullanılabilir değişkenler:</strong>{' '}
              <Badge variant="outline" className="mx-1">{'{{name}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{first_name}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{company}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{email}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{phone}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{website}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{message}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{source}}'}</Badge>
              <Badge variant="outline" className="mx-1">{'{{status}}'}</Badge>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Form */}
            <div className="space-y-4">
              {/* Subject Input */}
              <div className="space-y-2">
                <Label htmlFor="subject">Konu</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E-posta konusu"
                  disabled={isSending}
                />
              </div>

              {/* Body Textarea */}
              <div className="space-y-2">
                <Label htmlFor="body">İçerik (HTML desteklenir)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="E-posta içeriği..."
                  rows={10}
                  disabled={isSending}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-2">
              <Label>Canlı Önizleme</Label>
              <div className="border rounded-lg p-4 h-[400px] overflow-y-auto bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSending}
          >
            İptal
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Gönder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
