'use client';

import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Code2 } from 'lucide-react';

interface VariableSelectorProps {
  onInsert: (variable: string) => void;
  editorRef?: RefObject<any>;
}

const TEMPLATE_VARIABLES = [
  { key: 'name', label: 'Ad Soyad', description: 'Lead tam adı' },
  { key: 'first_name', label: 'Ad', description: 'Lead ilk adı' },
  { key: 'email', label: 'E-posta', description: 'Lead e-posta adresi' },
  { key: 'phone', label: 'Telefon', description: 'Lead telefon numarası' },
  { key: 'company', label: 'Şirket', description: 'Lead şirketi' },
  { key: 'website', label: 'Website', description: 'Lead websitesi' },
  { key: 'message', label: 'Mesaj', description: 'Lead mesajı' },
  { key: 'source', label: 'Kaynak', description: 'Lead kaynağı (Türkçe)' },
  { key: 'status', label: 'Durum', description: 'Lead durumu (Türkçe)' },
];

export function VariableSelector({ onInsert, editorRef }: VariableSelectorProps) {
  const handleInsert = (variable: string) => {
    // If editor ref is provided, try to insert at cursor position
    if (editorRef?.current) {
      const editor = editorRef.current;
      const variableText = `{${variable}}`;

      // Check if editor has insertText method (TipTap)
      if (typeof editor.view?.dispatch === 'function') {
        editor.chain().focus().insertContent(variableText).run();
      } else if (typeof editor.insertText === 'function') {
        // Fallback for other editors
        editor.insertText(variableText);
      } else {
        // Final fallback - just call the onInsert callback
        onInsert(variableText);
      }
    } else {
      // No editor ref, just call the callback
      onInsert(`{${variable}}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Code2 className="h-4 w-4 mr-2" />
          Değişken Ekle
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {TEMPLATE_VARIABLES.map((variable) => (
          <DropdownMenuItem
            key={variable.key}
            onClick={() => handleInsert(variable.key)}
          >
            <div className="flex flex-col">
              <span className="font-medium">{variable.label}</span>
              <span className="text-xs text-muted-foreground">
                {'{' + variable.key + '}'} - {variable.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
