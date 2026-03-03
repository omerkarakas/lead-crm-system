'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Loader2 } from 'lucide-react';

interface WelcomeMessageConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (message: string) => Promise<void>;
  currentMessage?: string;
}

const DEFAULT_WELCOME_MESSAGE = `Merhaba {name}! 👋

Başvurunuz için teşekkürler. Size yardımcı olabilmemiz için birkaç soru:`;

const POLL_FOOTER = `\n\nCevapları "1a, 2b" formatında yazabilirsiniz.`;

export function WelcomeMessageConfig({
  open,
  onClose,
  onSave,
  currentMessage = DEFAULT_WELCOME_MESSAGE,
}: WelcomeMessageConfigProps) {
  const [message, setMessage] = useState(currentMessage);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setMessage(currentMessage);
  }, [currentMessage, open]);

  const formatPreview = (msg: string) => {
    // Replace {name} with example data
    let preview = msg.replace(/{name}/g, 'Ahmet Yılmaz');
    preview = preview.replace(/{company}/g, 'Moka Dijital');
    return preview + POLL_FOOTER;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(message);
      onClose();
    } catch (error) {
      console.error('Error saving welcome message:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setMessage(DEFAULT_WELCOME_MESSAGE);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Karşılama Mesajı</DialogTitle>
          <DialogDescription>
            Lead'lere gönderilecek ilk mesajı düzenleyin. {"{name}"} ve {"{company}"} değişkenlerini kullanabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Mesaj İçeriği *</Label>
            <Textarea
              id="welcome-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder={DEFAULT_WELCOME_MESSAGE}
            />
            <p className="text-sm text-muted-foreground">
              Kullanılabilir değişkenler: {"{name}"}, {"{company}"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showPreview ? 'Önizlemeyi Gizle' : 'Önizleme Göster'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToDefault}
            >
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
