'use client';

import { QuestionType } from '@/types/qa';
import { Button } from '@/components/ui/button';
import { CheckCircle, ListChecks, Gauge, MessageSquare } from 'lucide-react';

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
  disabled?: boolean;
}

const QUESTION_TYPES = [
  {
    type: 'single' as QuestionType,
    label: 'Tek Cevap',
    description: 'Lead sadece bir seçenek seçebilir',
    icon: CheckCircle,
    example: 'a) Option 1\nb) Option 2\nc) Option 3'
  },
  {
    type: 'multiple' as QuestionType,
    label: 'Çoklu Seçim',
    description: 'Lead birden fazla seçenek seçebilir',
    icon: ListChecks,
    example: 'a) Option 1\nb) Option 2\nc) Option 3\n(Birden fazla seçilebilir)'
  },
  {
    type: 'likert' as QuestionType,
    label: 'Anket Skalası',
    description: '1-5 arası puanlama',
    icon: Gauge,
    example: '1) Çok kötü\n2) Kötü\n3) Nötr\n4) İyi\n5) Çok iyi'
  },
  {
    type: 'open' as QuestionType,
    label: 'Açık Uçlu',
    description: 'Lead serbest metin girer',
    icon: MessageSquare,
    example: 'Cevabınızı buraya yazın...'
  },
];

export function QuestionTypeSelector({ value, onChange, disabled }: QuestionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {QUESTION_TYPES.map(({ type, label, description, icon: Icon }) => (
        <Button
          key={type}
          type="button"
          variant={value === type ? "default" : "outline"}
          className="h-auto p-4 flex flex-col items-start gap-2"
          onClick={() => onChange(type)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 w-full">
            <Icon className="h-4 w-4" />
            <span className="font-semibold">{label}</span>
          </div>
          <span className="text-xs text-left opacity-80">{description}</span>
        </Button>
      ))}
    </div>
  );
}
