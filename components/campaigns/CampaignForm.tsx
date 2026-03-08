'use client';

import { useState, useEffect } from 'react';
import { Campaign, CreateCampaignDto, UpdateCampaignDto, CampaignType, AudienceSegment, SegmentOperator, RuleOperator } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, MessageSquare, Plus, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignsStore } from '@/lib/stores/campaigns';

interface CampaignFormProps {
  campaign?: Campaign;
  onSave: (data: CreateCampaignDto | UpdateCampaignDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface SegmentRuleForm {
  field: string;
  operator: RuleOperator;
  value: string;
}

const FIELD_OPTIONS = [
  { value: 'score', label: 'Skor' },
  { value: 'status', label: 'Durum' },
  { value: 'source', label: 'Kaynak' },
  { value: 'tags', label: 'Etiketler' },
];

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'Eşittir' },
  { value: 'ne', label: 'Eşit Değil' },
  { value: 'gt', label: 'Büyüktür' },
  { value: 'lt', label: 'Küçüktür' },
  { value: 'gte', label: 'Büyük Eşit' },
  { value: 'lte', label: 'Küçük Eşit' },
  { value: 'contains', label: 'İçerir' },
  { value: 'not_contains', label: 'İçermez' },
];

const STATUS_OPTIONS = ['new', 'qualified', 'booked', 'customer', 'lost'];
const SOURCE_OPTIONS = ['web_form', 'api', 'manual', 'whatsapp'];

export function CampaignForm({
  campaign,
  onSave,
  onCancel,
  isLoading = false,
}: CampaignFormProps) {
  const [name, setName] = useState(campaign?.name || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [type, setType] = useState<CampaignType>(campaign?.type || CampaignType.Email);
  const [isActive, setIsActive] = useState(campaign?.is_active ?? true);
  const [autoEnrollMinScore, setAutoEnrollMinScore] = useState(campaign?.auto_enroll_min_score?.toString() || '');
  const [segmentOperator, setSegmentOperator] = useState<SegmentOperator>(
    campaign?.audience_segment?.operator || SegmentOperator.And
  );
  const [rules, setRules] = useState<SegmentRuleForm[]>(
    campaign?.audience_segment?.rules.map((r, i) => ({
      field: r.field,
      operator: r.operator,
      value: String(r.value),
    })) || []
  );
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const { previewData, showPreview, isPreviewOpen, hidePreview } = useCampaignsStore();

  useEffect(() => {
    return () => {
      hidePreview();
    };
  }, [hidePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Lütfen kampanya adı girin');
      return;
    }

    if (rules.length === 0) {
      toast.error('En az bir segment kuralı ekleyin');
      return;
    }

    const audienceSegment: AudienceSegment = {
      operator: segmentOperator,
      rules: rules.map(r => ({
        field: r.field,
        operator: r.operator,
        value: r.field === 'score' ? Number(r.value) : r.value,
      })),
    };

    const data: CreateCampaignDto | UpdateCampaignDto = {
      name: name.trim(),
      description: description.trim(),
      type,
      audience_segment: audienceSegment,
      auto_enroll_min_score: autoEnrollMinScore ? Number(autoEnrollMinScore) : undefined,
      is_active: isActive,
    };

    await onSave(data);
  };

  const handleAddRule = () => {
    setRules([...rules, { field: 'score', operator: 'eq', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, field: keyof SegmentRuleForm, value: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handlePreview = async () => {
    if (rules.length === 0) {
      toast.error('En az bir segment kuralı ekleyin');
      return;
    }

    const segment: AudienceSegment = {
      operator: segmentOperator,
      rules: rules.map(r => ({
        field: r.field,
        operator: r.operator,
        value: r.field === 'score' ? Number(r.value) : r.value,
      })),
    };

    await showPreview(segment);
    setPreviewExpanded(true);
  };

  const getValueOptions = (field: string) => {
    switch (field) {
      case 'status':
        return STATUS_OPTIONS.map(s => ({ value: s, label: s }));
      case 'source':
        return SOURCE_OPTIONS.map(s => ({ value: s, label: s }));
      default:
        return [];
    }
  };

  const renderValueInput = (rule: SegmentRuleForm, index: number) => {
    const valueOptions = getValueOptions(rule.field);

    if (valueOptions.length > 0) {
      return (
        <Select
          value={rule.value}
          onValueChange={(value) => handleRuleChange(index, 'value', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Değer seçin" />
          </SelectTrigger>
          <SelectContent>
            {valueOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={rule.field === 'score' ? 'number' : 'text'}
        value={rule.value}
        onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
        placeholder={rule.field === 'score' ? 'Skor' : 'Değer'}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Kampanya Adı *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Yeni Lead Takip Kampanyası"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kampanya açıklaması..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
        <Label>Kampanya Türü *</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setType(CampaignType.Email)}
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
              type === CampaignType.Email
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            disabled={isLoading}
          >
            <Mail className="h-8 w-8 mb-2" />
            <span className="font-medium">E-posta</span>
          </button>
          <button
            type="button"
            onClick={() => setType(CampaignType.WhatsApp)}
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
              type === CampaignType.WhatsApp
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            disabled={isLoading}
          >
            <MessageSquare className="h-8 w-8 mb-2" />
            <span className="font-medium">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Audience Segment */}
      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Hedef Kitle Segmenti *</Label>
          <Select
            value={segmentOperator}
            onValueChange={(value) => setSegmentOperator(value as SegmentOperator)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">VE (AND)</SelectItem>
              <SelectItem value="or">VEYA (OR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-start">
              <Select
                value={rule.field}
                onValueChange={(value) => handleRuleChange(index, 'field', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Alan" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={rule.operator}
                onValueChange={(value) => handleRuleChange(index, 'operator', value as RuleOperator)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Operatör" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1">
                {renderValueInput(rule, index)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRule(index)}
                disabled={isLoading || rules.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          disabled={isLoading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Kural Ekle
        </Button>
      </div>

      {/* Segment Preview */}
      <div className="border rounded-lg p-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={isLoading || rules.length === 0}
          className="w-full"
        >
          <Users className="h-4 w-4 mr-2" />
          Segment Önizleme
        </Button>

        {isPreviewOpen && previewData && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Eşleşen Lead Sayısı:</span>
              <Badge variant="secondary">{previewData.count}</Badge>
            </div>

            {previewExpanded && previewData.sample_leads.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Örnek Leadler:</p>
                {previewData.sample_leads.map(lead => (
                  <div key={lead.id} className="text-xs p-2 bg-muted rounded">
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {lead.status} • {lead.score} puan
                    </span>
                  </div>
                ))}
              </div>
            )}

            {previewData.sample_leads.length > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="w-full"
              >
                {previewExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Gizle
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Örnek Leadleri Göster
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Auto Enroll Minimum Score */}
      <div className="space-y-2">
        <Label htmlFor="autoEnrollMinScore">Otomatik Kayıt Minimum Skor</Label>
        <Input
          id="autoEnrollMinScore"
          type="number"
          min="0"
          max="100"
          value={autoEnrollMinScore}
          onChange={(e) => setAutoEnrollMinScore(e.target.value)}
          placeholder="Boş = devre dışı"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Bu skora ulaşan leadler otomatik olarak bu kampanyaya dahil olur
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Aktif</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : campaign ? (
            'Güncelle'
          ) : (
            'Oluştur'
          )}
        </Button>
      </div>
    </form>
  );
}
