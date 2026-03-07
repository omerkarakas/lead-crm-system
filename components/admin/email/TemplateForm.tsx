'use client';

import { useEffect, useRef, useState } from 'react';
import { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '@/types/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mail } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { VariableSelector } from './VariableSelector';
import { CategoryCombobox } from './CategoryCombobox';
import { sendTestEmail } from '@/lib/api/email-templates';
import { toast } from 'sonner';

interface TemplateFormProps {
  template?: EmailTemplate;
  categories: string[];
  onSave: (data: CreateEmailTemplateDto | UpdateEmailTemplateDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateForm({
  template,
  categories,
  onSave,
  onCancel,
  isLoading = false,
}: TemplateFormProps) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [category, setCategory] = useState(template?.category || '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const editorRef = useRef<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const data: CreateEmailTemplateDto | UpdateEmailTemplateDto = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      category: category.trim() || 'generic',
      is_active: isActive,
    };

    await onSave(data);
  };

  const handleSendTestEmail = async () => {
    if (!template?.id) {
      toast.error('Test e-postası göndermek için önce şablonu kaydedin');
      return;
    }

    if (!testEmailAddress.trim()) {
      toast.error('Lütfen test e-posta adresi girin');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmailAddress)) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }

    setSendingTest(true);
    try {
      await sendTestEmail(template.id, testEmailAddress);
      toast.success('Test e-postası gönderildi');
      setTestEmailAddress('');
    } catch (error: any) {
      toast.error(error.message || 'Test e-postası gönderilemedi');
    } finally {
      setSendingTest(false);
    }
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
          placeholder="Hoşgeldin e-postası"
          disabled={isLoading}
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          E-posta Konusu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Hoşgeldiniz {name}!"
          disabled={isLoading}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <CategoryCombobox
          value={category}
          onChange={setCategory}
          categories={categories}
          placeholder="Kategori seçin veya yeni yazın..."
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">
            E-posta İçeriği <span className="text-destructive">*</span>
          </Label>
          <VariableSelector
            onInsert={handleVariableInsert}
            editorRef={editorRef}
          />
        </div>
        <RichTextEditor
          ref={editorRef}
          content={body}
          onChange={setBody}
          placeholder="E-posta içeriğini buraya yazın..."
        />
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Aktif</Label>
          <p className="text-sm text-muted-foreground">
            Pasif şablonlar gönderilemez
          </p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
      </div>

      {/* Test Email (only for editing) */}
      {template && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <Label className="font-medium">Test E-postası Gönder</Label>
          </div>
          <div className="flex gap-2">
            <Input
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="test@example.com"
              disabled={sendingTest}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailAddress}
            >
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Gönder'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
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
    </form>
  );
}
