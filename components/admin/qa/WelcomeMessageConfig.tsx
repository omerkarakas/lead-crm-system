"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Loader2, Code2 } from "lucide-react";

interface WelcomeMessageConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (message: string) => Promise<void>;
  currentMessage?: string;
  activeQuestionCount?: number;
}

const QA_VARIABLES = [
  { key: "name", label: "Ad Soyad", description: "Lead tam adı" },
  { key: "company", label: "Şirket", description: "Lead şirketi" },
  { key: "soru_sayisi", label: "Soru Sayısı", description: "Aktif soru sayısı" },
];

const DEFAULT_WELCOME_MESSAGE = `Merhaba {name}! 👋

Başvurunuz için teşekkürler. Size yardımcı olabilmemiz için {soru_sayisi} kısa soru sormak istiyorum:`;

const POLL_FOOTER = `\n\nCevapları "1a, 2b, 3c" formatında yazabilirsiniz.`;

export function WelcomeMessageConfig({
  open,
  onClose,
  onSave,
  currentMessage = DEFAULT_WELCOME_MESSAGE,
  activeQuestionCount = 0,
}: WelcomeMessageConfigProps) {
  const [message, setMessage] = useState(currentMessage);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessage(currentMessage);
  }, [currentMessage, open]);

  const formatPreview = (msg: string) => {
    // Replace {name} with example data
    let preview = msg.replace(/{name}/g, "Ahmet Yılmaz");
    preview = preview.replace(/{company}/g, "Moka Dijital");
    // Replace {soru_sayisi} with actual active question count
    preview = preview.replace(/{soru_sayisi}/g, String(activeQuestionCount));
    return preview + POLL_FOOTER;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(message);
      onClose();
    } catch (error) {
      console.error("Error saving welcome message:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setMessage(DEFAULT_WELCOME_MESSAGE);
  };

  const handleInsertVariable = (variableKey: string) => {
    const variableText = `{${variableKey}}`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = message.substring(0, start) + variableText + message.substring(end);
      setMessage(newValue);

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Karşılama Mesajı</DialogTitle>
          <DialogDescription>
            Lead'lere gönderilecek ilk mesajı düzenleyin. {"{name}"}, {"{company}"} ve {"{soru_sayisi}"} değişkenlerini
            kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="welcome-message">Mesaj İçeriği *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-2" />
                    Değişken Ekle
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {QA_VARIABLES.map((variable) => (
                    <DropdownMenuItem key={variable.key} onClick={() => handleInsertVariable(variable.key)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{variable.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {"{" + variable.key + "}"} - {variable.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              id="welcome-message"
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder={DEFAULT_WELCOME_MESSAGE}
            />
            <p className="text-sm text-muted-foreground">
              Kullanılabilir değişkenler: {"{name}"}, {"{company}"}, {"{soru_sayisi}"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {showPreview ? "Önizlemeyi Gizle" : "Önizleme Göster"}
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={resetToDefault}>
              Varsayılana Dön
            </Button>
          </div>

          {showPreview && (
            <div className="space-y-2">
              <Label>WhatsApp Önizleme</Label>
              <div className="bg-slate-50 border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                {formatPreview(message)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading || !message.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_WELCOME_MESSAGE, POLL_FOOTER };
