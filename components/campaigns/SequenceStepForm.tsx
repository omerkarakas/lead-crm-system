'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { SequenceStep } from '@/types/campaign';
import { StepType, DelayType } from '@/types/campaign';
import type { EmailTemplate } from '@/types/email';
import * as emailTemplatesApi from '@/lib/api/email-templates';

interface SequenceStepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: SequenceStep) => void;
  step?: SequenceStep;
  stepType?: StepType;
}

type FormStepType = 'email' | 'whatsapp' | 'delay' | null;

export function SequenceStepForm({
  isOpen,
  onClose,
  onSave,
  step,
  stepType,
}: SequenceStepFormProps) {
  const [selectedType, setSelectedType] = useState<FormStepType>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [delayType, setDelayType] = useState<DelayType>(DelayType.Relative);
  const [delayMinutes, setDelayMinutes] = useState<number>(60);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await emailTemplatesApi.fetchActiveTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Initialize form when editing existing step
  useEffect(() => {
    if (step) {
      setSelectedType(step.type);
      setTemplateId(step.template_id || '');
      setDelayType(step.delay_type || DelayType.Relative);
      setDelayMinutes(step.delay_minutes || 60);
      setScheduledTime(step.scheduled_time || '');

      // Load template details
      if (step.template_id) {
        loadTemplateDetails(step.template_id);
      }
    } else if (stepType) {
      setSelectedType(stepType);
    }
  }, [step, stepType]);

  const loadTemplateDetails = async (id: string) => {
    try {
      const template = await emailTemplatesApi.fetchTemplateById(id);
      setSelectedTemplate(template);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleTemplateChange = (value: string) => {
    setTemplateId(value);
    loadTemplateDetails(value);
  };

  const handleQuickSelect = (minutes: number) => {
    setDelayMinutes(minutes);
  };

  const handleSave = () => {
    if (!selectedType) {
      return;
    }

    const newStep: SequenceStep = {
      id: step?.id || crypto.randomUUID(),
      order: step?.order || 0,
      type: selectedType as StepType,
      template_id: (selectedType === 'email' || selectedType === 'whatsapp') ? templateId : undefined,
      delay_type: selectedType === 'delay' ? delayType : undefined,
      delay_minutes: selectedType === 'delay' && delayType === DelayType.Relative ? delayMinutes : undefined,
      scheduled_time: selectedType === 'delay' && delayType === DelayType.Absolute ? scheduledTime : undefined,
    };

    onSave(newStep);
    handleClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setTemplateId('');
    setDelayType(DelayType.Relative);
    setDelayMinutes(60);
    setScheduledTime('');
    setSelectedTemplate(null);
    onClose();
  };

  const isFormValid = () => {
    if (!selectedType) return false;

    if (selectedType === 'email' || selectedType === 'whatsapp') {
      return !!templateId;
    }

    if (selectedType === 'delay') {
      if (delayType === DelayType.Relative) {
        return delayMinutes > 0;
      } else {
        return !!scheduledTime;
      }
    }

    return false;
  };

  const formatDelayDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} dk`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} saat`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} gün`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step ? 'Adımı Düzenle' : 'Yeni Adım Ekle'}
          </DialogTitle>
          <DialogDescription>
            {step ? 'Mevcut adımın detaylarını düzenleyin' : 'Sıraya yeni bir adım ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step Type Selection (only for new steps without pre-selected type) */}
          {!step && !stepType && (
            <div className="space-y-3">
              <Label>Adım Türü</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className={`cursor-pointer transition-colors ${
                    selectedType === 'email'
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedType('email')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Email Adımı</p>
                      <p className="text-sm text-muted-foreground">Email şablonu gönder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-colors ${
                    selectedType === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedType('whatsapp')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Adımı</p>
                      <p className="text-sm text-muted-foreground">WhatsApp şablonu gönder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-colors ${
                    selectedType === 'delay'
                      ? 'border-gray-500 bg-gray-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedType('delay')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Gecikme Adımı</p>
                      <p className="text-sm text-muted-foreground">Zamanlama ekle</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Email/WhatsApp Step Configuration */}
          {(selectedType === 'email' || selectedType === 'whatsapp') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">
                  Şablon <span className="text-destructive">*</span>
                </Label>
                <Select value={templateId} onValueChange={handleTemplateChange}>
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

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">Şablon Önizleme</p>
                  <p className="text-sm">
                    <span className="font-medium">Konu:</span> {selectedTemplate.subject}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Kategori:</span> {selectedTemplate.category}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Delay Step Configuration */}
          {selectedType === 'delay' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Zamanlama Türü</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mutlak Zaman</span>
                  <Switch
                    checked={delayType === DelayType.Absolute}
                    onCheckedChange={(checked) =>
                      setDelayType(checked ? DelayType.Absolute : DelayType.Relative)
                    }
                  />
                  <span className="text-sm">Adım Sonrası</span>
                </div>
              </div>

              {delayType === DelayType.Relative ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delayMinutes">
                      Gecikme Süresi (dakika) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="delayMinutes"
                      type="number"
                      min="1"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hızlı Seçim</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSelect(15)}
                      >
                        15 dk
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSelect(60)}
                      >
                        1 saat
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSelect(1440)}
                      >
                        1 gün
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSelect(10080)}
                      >
                        1 hafta
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seçilen: {formatDelayDisplay(delayMinutes)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">
                      Zamanlama <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="scheduledTime"
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Uyarı:</strong> Mutlak zamanlama, lead'in kayıt zamanına değil
                      belirtilen zamana göre çalışır.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Saat Dilimi</Label>
                    <Select defaultValue="Europe/Istanbul">
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Istanbul">Europe/Istanbul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid() || isLoading}
          >
            {step ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
