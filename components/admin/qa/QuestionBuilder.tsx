'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, MessageSquare } from 'lucide-react';
import { QAQuestion, CreateQAQuestionDto, UpdateQAQuestionDto } from '@/types/qa';

interface QuestionBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateQAQuestionDto | UpdateQAQuestionDto) => Promise<void>;
  editingQuestion?: QAQuestion | null;
}

export function QuestionBuilder({
  open,
  onClose,
  onSave,
  editingQuestion,
}: QuestionBuilderProps) {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [pointsA, setPointsA] = useState(30);
  const [pointsB, setPointsB] = useState(60);
  const [pointsC, setPointsC] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEditing = !!editingQuestion;

  // Update form when editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      setQuestionText(editingQuestion.question_text || '');
      setOptionA(editingQuestion.options.find(o => o.startsWith('a)'))?.replace('a) ', '') || '');
      setOptionB(editingQuestion.options.find(o => o.startsWith('b)'))?.replace('b) ', '') || '');
      setOptionC(editingQuestion.options.find(o => o.startsWith('c)'))?.replace('c) ', '') || '');
      setPointsA(editingQuestion.points?.a ?? 30);
      setPointsB(editingQuestion.points?.b ?? 60);
      setPointsC(editingQuestion.points?.c ?? 100);
      setIsActive(editingQuestion.is_active ?? true);
    } else {
      // Reset form for new question
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setPointsA(30);
      setPointsB(60);
      setPointsC(100);
      setIsActive(true);
    }
  }, [editingQuestion, open]);

  const formatWhatsAppMessage = () => {
    if (!questionText) return '';

    let message = `*${questionText}*\n\n`;
    message += `${optionA ? `a) ${optionA}` : ''}${optionB ? `\nb) ${optionB}` : ''}${optionC ? `\nc) ${optionC}` : ''}`;

    return message;
  };

  const handleSave = async () => {
    if (!questionText || !optionA || !optionB || !optionC) {
      return;
    }

    setLoading(true);

    try {
      const data: CreateQAQuestionDto | UpdateQAQuestionDto = {
        question_text: questionText,
        options: [`a) ${optionA}`, `b) ${optionB}`, `c) ${optionC}`],
        points: { a: pointsA, b: pointsB, c: pointsC },
        is_active: isActive,
      };

      if (isEditing && editingQuestion) {
        // Keep existing order when editing
        await onSave({ ...data, id: editingQuestion.id } as UpdateQAQuestionDto);
      } else {
        // For new questions, order will be set by the backend (questions.length + 1)
        await onSave(data);
      }

      // Reset form
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setPointsA(30);
      setPointsB(60);
      setPointsC(100);
      setIsActive(true);
      setShowPreview(false);
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Soru Düzenle' : 'Yeni Soru Oluştur'}
          </DialogTitle>
          <DialogDescription>
            WhatsApp için nitelik soruları oluşturun. Sorular mesaj olarak gönderilecek.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Soru Metni *</Label>
            <Textarea
              id="question-text"
              placeholder="Örn: Şirketinizde kaç kişi çalışıyor?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label>Seçenekler *</Label>

            {/* Option A */}
            <div className="flex gap-2 items-start">
              <div className="w-8 h-10 flex items-center justify-center bg-slate-100 rounded font-semibold">
                a)
              </div>
              <Input
                placeholder="1. seçenek"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="points-a" className="whitespace-nowrap">
                  Puan:
                </Label>
                <Input
                  id="points-a"
                  type="number"
                  min="0"
                  max="100"
                  value={pointsA}
                  onChange={(e) => setPointsA(Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            {/* Option B */}
            <div className="flex gap-2 items-start">
              <div className="w-8 h-10 flex items-center justify-center bg-slate-100 rounded font-semibold">
                b)
              </div>
              <Input
                placeholder="2. seçenek"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="points-b" className="whitespace-nowrap">
                  Puan:
                </Label>
                <Input
                  id="points-b"
                  type="number"
                  min="0"
                  max="100"
                  value={pointsB}
                  onChange={(e) => setPointsB(Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            {/* Option C */}
            <div className="flex gap-2 items-start">
              <div className="w-8 h-10 flex items-center justify-center bg-slate-100 rounded font-semibold">
                c)
              </div>
              <Input
                placeholder="3. seçenek"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="points-c" className="whitespace-nowrap">
                  Puan:
                </Label>
                <Input
                  id="points-c"
                  type="number"
                  min="0"
                  max="100"
                  value={pointsC}
                  onChange={(e) => setPointsC(Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aktif</Label>
              <p className="text-sm text-muted-foreground">
                Sadece aktif sorular lead'lere gönderilir
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>WhatsApp Önizleme</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showPreview ? 'Gizle' : 'Göster'}
              </Button>
            </div>

            {showPreview && (
              <div className="bg-slate-50 border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                {formatWhatsAppMessage() || 'Soru metni giriniz...'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading || !questionText || !optionA || !optionB || !optionC}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
