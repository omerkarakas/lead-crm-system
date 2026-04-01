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
import { Loader2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { QAQuestion, CreateQAQuestionDto, UpdateQAQuestionDto, QuestionType } from '@/types/qa';
import { QuestionTypeSelector } from './QuestionTypeSelector';

interface QuestionBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateQAQuestionDto | UpdateQAQuestionDto) => Promise<void>;
  editingQuestion?: QAQuestion | null;
}

interface Option {
  text: string;
  points: number;
}

export function QuestionBuilder({
  open,
  onClose,
  onSave,
  editingQuestion,
}: QuestionBuilderProps) {
  // Question type state
  const [questionType, setQuestionType] = useState<QuestionType>('single');

  // Common fields
  const [questionText, setQuestionText] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Single/Multiple choice options
  const [options, setOptions] = useState<Option[]>([
    { text: '', points: 30 },
    { text: '', points: 60 },
    { text: '', points: 100 },
  ]);
  const [maxSelections, setMaxSelections] = useState<number>(2);

  // Likert scale fields
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(5);
  const [pointsPerLevel, setPointsPerLevel] = useState(10);

  // Open-ended fields
  const [minLength, setMinLength] = useState(10);
  const [maxLength, setMaxLength] = useState(500);
  const [openPoints, setOpenPoints] = useState(5);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');

  const isEditing = !!editingQuestion;

  // Update form when editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      const type = editingQuestion.question_type || 'single';
      setQuestionType(type);
      setQuestionText(editingQuestion.question_text || '');
      setIsActive(editingQuestion.is_active ?? true);

      // Load type-specific data
      if (type === 'single' || type === 'multiple') {
        // Parse options from "a) Option 1" format
        const parsedOptions = editingQuestion.options.map((opt, i) => {
          const text = opt.replace(/^[a-z]\)\s*/, '');
          const key = type === 'single' ? String.fromCharCode(97 + i) : opt;
          const points = editingQuestion.points?.[key] || 0;
          return { text, points };
        });
        setOptions(parsedOptions);
        if (type === 'multiple') {
          setMaxSelections((editingQuestion as any).max_selections || 2);
        }
      } else if (type === 'likert') {
        setScaleMin((editingQuestion as any).scale_min || 1);
        setScaleMax((editingQuestion as any).scale_max || 5);
        setPointsPerLevel((editingQuestion as any).points_per_level || 10);
      } else if (type === 'open') {
        setMinLength((editingQuestion as any).min_length || 10);
        setMaxLength((editingQuestion as any).max_length || 500);
        setOpenPoints((editingQuestion as any).points || 5);
      }
    } else {
      // Reset form for new question
      setQuestionType('single');
      setQuestionText('');
      setIsActive(true);
      setOptions([
        { text: '', points: 30 },
        { text: '', points: 60 },
        { text: '', points: 100 },
      ]);
      setMaxSelections(2);
      setScaleMin(1);
      setScaleMax(5);
      setPointsPerLevel(10);
      setMinLength(10);
      setMaxLength(500);
      setOpenPoints(5);
    }
    setError('');
  }, [editingQuestion, open]);

  // Reset options when question type changes to single/multiple
  useEffect(() => {
    if (!isEditing && (questionType === 'single' || questionType === 'multiple')) {
      setOptions([
        { text: '', points: 30 },
        { text: '', points: 60 },
        { text: '', points: 100 },
      ]);
    }
  }, [questionType, isEditing]);

  const formatWhatsAppMessage = () => {
    if (!questionText) return '';

    if (questionType === 'single' || questionType === 'multiple') {
      let message = `*${questionText}*\n\n`;
      options.forEach((opt, i) => {
        const letter = String.fromCharCode(97 + i); // a, b, c, ...
        message += `${letter}) ${opt.text || '(seçenek)'}\n`;
      });
      if (questionType === 'multiple') {
        message += '\n(Birden fazla seçebilirsiniz)';
      }
      return message;
    }

    if (questionType === 'likert') {
      let message = `*${questionText}*\n\n`;
      for (let i = scaleMin; i <= scaleMax; i++) {
        message += `${i}) ${i === scaleMin ? 'Çok kötü' : i === scaleMax ? 'Çok iyi' : '-'}\n`;
      }
      return message.trim();
    }

    if (questionType === 'open') {
      return `*${questionText}*\n\nCevabınızı buraya yazın...`;
    }

    return '';
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { text: '', points: 10 }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: string | number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const validateForm = (): boolean => {
    if (!questionText.trim()) {
      setError('Soru metni boş olamaz');
      return false;
    }

    if (questionType === 'single' || questionType === 'multiple') {
      if (options.length < 2) {
        setError('En az 2 seçenek gerekli');
        return false;
      }
      if (options.some(opt => !opt.text.trim())) {
        setError('Tüm seçeneklerin metni dolu olmalı');
        return false;
      }
      if (questionType === 'multiple' && maxSelections > options.length) {
        setError('Maksimum seçim sayısı seçenek sayısından fazla olamaz');
        return false;
      }
    }

    if (questionType === 'likert') {
      if (scaleMin >= scaleMax) {
        setError('Minimum skalası maksimumdan küçük olmalı');
        return false;
      }
    }

    if (questionType === 'open') {
      if (minLength > maxLength) {
        setError('Minimum uzunluk maksimum uzunluktan büyük olamaz');
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let data: CreateQAQuestionDto | UpdateQAQuestionDto;

      if (questionType === 'single') {
        data = {
          question_text: questionText,
          question_type: 'single',
          options: options.map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt.text}`),
          points: Object.fromEntries(
            options.map((opt, i) => [String.fromCharCode(97 + i), opt.points])
          ),
          is_active: isActive,
        };
      } else if (questionType === 'multiple') {
        data = {
          question_text: questionText,
          question_type: 'multiple',
          options: options.map((opt, i) => opt.text),
          points: Object.fromEntries(
            options.map((opt, i) => [`option${i + 1}`, opt.points])
          ),
          max_selections: maxSelections,
          is_active: isActive,
        };
      } else if (questionType === 'likert') {
        data = {
          question_text: questionText,
          question_type: 'likert',
          scale_min: scaleMin,
          scale_max: scaleMax,
          points_per_level: pointsPerLevel,
          is_active: isActive,
        };
      } else {
        // open
        data = {
          question_text: questionText,
          question_type: 'open',
          min_length: minLength,
          max_length: maxLength,
          points: openPoints,
          is_active: isActive,
        };
      }

      if (isEditing && editingQuestion) {
        await onSave({ ...data, id: editingQuestion.id } as UpdateQAQuestionDto);
      } else {
        await onSave(data);
      }

      // Reset form
      setQuestionType('single');
      setQuestionText('');
      setIsActive(true);
      setOptions([
        { text: '', points: 30 },
        { text: '', points: 60 },
        { text: '', points: 100 },
      ]);
      setMaxSelections(2);
      setScaleMin(1);
      setScaleMax(5);
      setPointsPerLevel(10);
      setMinLength(10);
      setMaxLength(500);
      setOpenPoints(5);
      setShowPreview(false);
      setError('');
      onClose();
    } catch (error: any) {
      console.error('Error saving question:', error);
      setError(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Soru Düzenle' : 'Yeni Soru Oluştur'}
          </DialogTitle>
          <DialogDescription>
            WhatsApp için nitelik soruları oluşturun. Sorular mesaj olarak gönderilecek.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Type Selector */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Soru Tipi *</Label>
              <QuestionTypeSelector
                value={questionType}
                onChange={setQuestionType}
                disabled={isEditing}
              />
            </div>
          )}

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

          {/* Type-specific form sections */}
          {questionType === 'single' || questionType === 'multiple' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Seçenekler *</Label>
                <span className="text-xs text-muted-foreground">
                  {options.length}/6 seçenek
                </span>
              </div>

              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="w-8 h-10 flex items-center justify-center bg-slate-100 rounded font-semibold flex-shrink-0">
                    {String.fromCharCode(97 + index)})
                  </div>
                  <Input
                    placeholder={`${index + 1}. seçenek`}
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`points-${index}`} className="whitespace-nowrap">
                      Puan:
                    </Label>
                    <Input
                      id={`points-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      value={option.points}
                      onChange={(e) => updateOption(index, 'points', Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Seçenek Ekle
                </Button>
              )}

              {questionType === 'multiple' && (
                <div className="space-y-2">
                  <Label htmlFor="max-selections">Maksimum Seçim Sayısı</Label>
                  <Input
                    id="max-selections"
                    type="number"
                    min="1"
                    max={options.length}
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(Number(e.target.value))}
                    className="w-40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lead en fazla {maxSelections} seçenek seçebilir
                  </p>
                </div>
              )}
            </div>
          ) : questionType === 'likert' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scale-min">Minimum Skala</Label>
                  <Input
                    id="scale-min"
                    type="number"
                    min="1"
                    max="10"
                    value={scaleMin}
                    onChange={(e) => setScaleMin(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scale-max">Maksimum Skala</Label>
                  <Input
                    id="scale-max"
                    type="number"
                    min="1"
                    max="10"
                    value={scaleMax}
                    onChange={(e) => setScaleMax(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points-per-level">Her Seviye İçin Puan</Label>
                <Input
                  id="points-per-level"
                  type="number"
                  min="0"
                  value={pointsPerLevel}
                  onChange={(e) => setPointsPerLevel(Number(e.target.value))}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  Maksimum puan: {pointsPerLevel * (scaleMax - scaleMin + 1)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Önizleme</Label>
                <div className="bg-slate-50 border rounded-lg p-4 text-sm">
                  {Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => {
                    const num = scaleMin + i;
                    let label = '';
                    if (num === scaleMin) label = 'Çok kötü';
                    else if (num === scaleMax) label = 'Çok iyi';
                    else label = '-';

                    return (
                      <div key={num} className="py-1">
                        {num}) {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Open-ended
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-length">Minimum Uzunluk</Label>
                  <Input
                    id="min-length"
                    type="number"
                    min="0"
                    value={minLength}
                    onChange={(e) => setMinLength(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Karakter</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-length">Maksimum Uzunluk</Label>
                  <Input
                    id="max-length"
                    type="number"
                    min="1"
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Karakter</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="open-points">Puan</Label>
                <Input
                  id="open-points"
                  type="number"
                  min="0"
                  value={openPoints}
                  onChange={(e) => setOpenPoints(Number(e.target.value))}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  Lead cevap verirse bu puanı kazanır
                </p>
              </div>
            </div>
          )}

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

          {/* Error display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
