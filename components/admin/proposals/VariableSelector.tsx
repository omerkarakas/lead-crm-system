'use client';

import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Code2 } from 'lucide-react';
import { availableVariables } from '@/lib/api/proposal-templates';
import type { TemplateVariable } from '@/types/proposal';

interface VariableSelectorProps {
  onInsert: (variable: string) => void;
  editorRef?: RefObject<any>;
  customVariables?: TemplateVariable[];
}

export function VariableSelector({ onInsert, editorRef, customVariables = [] }: VariableSelectorProps) {
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

  const allVariables = [...availableVariables, ...customVariables];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Code2 className="h-4 w-4 mr-2" />
          Değişken Ekle
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {availableVariables.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              Standart Değişkenler
            </div>
            {availableVariables.map((variable) => (
              <DropdownMenuItem
                key={variable.name}
                onClick={() => handleInsert(variable.name)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{variable.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {'{' + variable.name + '}'} - {variable.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {customVariables.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
              Özel Değişkenler
            </div>
            {customVariables.map((variable) => (
              <DropdownMenuItem
                key={variable.name}
                onClick={() => handleInsert(variable.name)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{variable.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {'{' + variable.name + '}'} - {variable.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
