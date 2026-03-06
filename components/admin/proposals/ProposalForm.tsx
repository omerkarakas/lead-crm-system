'use client';

import { useEffect, useRef, useState } from 'react';
import { ProposalTemplate, CreateProposalTemplateDto, UpdateProposalTemplateDto, EditorType, TemplateVariable } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileText, Plus, Trash2, Eye } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/email/RichTextEditor';
import { VariableSelector } from '@/components/admin/proposals/VariableSelector';
import { previewTemplate } from '@/lib/api/proposal-templates';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProposalFormProps {
  template?: ProposalTemplate;
  onSave: (data: CreateProposalTemplateDto | UpdateProposalTemplateDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProposalForm({
  template,
  onSave,
  onCancel,
  isLoading = false,
}: ProposalFormProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [content, setContent] = useState(template?.content || '');
  const [editorType, setEditorType] = useState<EditorType>(template?.editor_type || EditorType.TIPTAP);
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [customVariables, setCustomVariables] = useState<TemplateVariable[]>(
    template?.variables || []
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (template) {
      setPreviewContent(previewTemplate(template));
    }
  }, [template]);

  const handleAddVariable = () => {
    setCustomVariables([
      ...customVariables,
      { name: '', label: '', description: '', default_value: '' },
    ]);
  };

  const handleRemoveVariable = (index: number) => {
    setCustomVariables(customVariables.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: keyof TemplateVariable, value: string) => {
    const updated = [...customVariables];
    updated[index] = { ...updated[index], [field]: value };
    setCustomVariables(updated);
  };

  const handlePreview = () => {
    const tempTemplate: ProposalTemplate = {
      id: template?.id || '',
      name,
      description,
      content,
      editor_type: editorType,
      variables: customVariables,
      is_active: isActive,
      is_deleted: false,
      created: template?.created || new Date().toISOString(),
      updated: template?.updated || new Date().toISOString(),
    };

    setPreviewContent(previewTemplate(tempTemplate));
    setShowPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Lütfen şablon adı girin');
      return;
    }

    if (!content.trim()) {
      toast.error('Lütfen şablon içeriği girin');
      return;
    }

    // Validate custom variables
    for (const variable of customVariables) {
      if (!variable.name.trim() || !variable.label.trim()) {
        toast.error('Tüm özel değişkenlerin ad ve etiket alanları zorunludur');
        return;
      }
    }

    const data: CreateProposalTemplateDto | UpdateProposalTemplateDto = {
      name: name.trim(),
      description: description.trim(),
      content: content.trim(),
      editor_type: editorType,
      variables: customVariables,
      is_active: isActive,
      is_deleted: false,
    };

    await onSave(data);
  };

  const handleVariableInsert = (variableText: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.chain().focus().insertContent(variableText).run();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Şablon Adı <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Proje Teklifi"
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
          placeholder="Web geliştirme projeleri için standart teklif şablonu"
          rows={2}
          disabled={isLoading}
        />
      </div>

      {/* Editor Type */}
      <div className="space-y-2">
        <Label htmlFor="editor_type">Editör Türü</Label>
        <Select
          value={editorType}
          onValueChange={(value) => setEditorType(value as EditorType)}
          disabled={isLoading}
        >
          <SelectTrigger id="editor_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EditorType.TIPTAP}>TipTap (Zengin Metin)</SelectItem>
            <SelectItem value={EditorType.MARKDOWN}>Markdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">
            Şablon İçeriği <span className="text-destructive">*</span>
          </Label>
          <VariableSelector
            onInsert={handleVariableInsert}
            editorRef={editorRef}
            customVariables={customVariables}
          />
        </div>
        {editorType === EditorType.TIPTAP ? (
          <RichTextEditor
            ref={editorRef}
            content={content}
            onChange={setContent}
            placeholder="Teklif içeriğini buraya yazın..."
          />
        ) : (
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Teklif içeriğini Markdown formatında yazın..."
            rows={10}
            disabled={isLoading}
            className="font-mono"
          />
        )}
      </div>

      {/* Custom Variables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Özel Değişkenler</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariable}
          >
            <Plus className="h-4 w-4 mr-1" />
            Değişken Ekle
          </Button>
        </div>
        {customVariables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz özel değişken eklenmedi. Standart değişkenleri kullanabilirsiniz.
          </p>
        ) : (
          <div className="space-y-3">
            {customVariables.map((variable, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`var-name-${index}`} className="text-xs">
                        Değişken Adı <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`var-name-${index}`}
                        value={variable.name}
                        onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                        placeholder="budget"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`var-label-${index}`} className="text-xs">
                        Etiket <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`var-label-${index}`}
                        value={variable.label}
                        onChange={(e) => handleVariableChange(index, 'label', e.target.value)}
                        placeholder="Bütçe"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`var-desc-${index}`} className="text-xs">
                      Açıklama
                    </Label>
                    <Input
                      id={`var-desc-${index}`}
                      value={variable.description}
                      onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                      placeholder="Proje bütçesi"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`var-default-${index}`} className="text-xs">
                      Varsayılan Değer
                    </Label>
                    <Input
                      id={`var-default-${index}`}
                      value={variable.default_value || ''}
                      onChange={(e) => handleVariableChange(index, 'default_value', e.target.value)}
                      placeholder="10000 ₺"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveVariable(index)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Aktif</Label>
          <p className="text-sm text-muted-foreground">
            Pasif şablonlar teklif oluşturmak için kullanılamaz
          </p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label className="font-medium">Önizleme</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              Kapat
            </Button>
          </div>
          <div
            className="prose prose-sm max-w-none p-4 bg-muted rounded-md"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={isLoading || !content.trim()}
        >
          <Eye className="h-4 w-4 mr-2" />
          Önizle
        </Button>
        <div className="flex gap-3">
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
            ) : template ? (
              'Güncelle'
            ) : (
              'Oluştur'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
