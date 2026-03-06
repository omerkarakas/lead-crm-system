'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useEffect, forwardRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editorRef?: React.RefObject<any>;
}

export const RichTextEditor = forwardRef<any, RichTextEditorProps>(
  ({ content, onChange, placeholder, editorRef }, ref) => {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline',
          },
        }),
        Underline.configure({
          HTMLAttributes: {
            class: 'underline',
          },
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-sm max-w-none min-h-[200px] p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
        },
      },
    });

    // Expose editor instance via ref
    useEffect(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        (ref as React.MutableRefObject<any>).current = editor;
      }
      if (editorRef && typeof editorRef === 'object' && 'current' in editorRef) {
        (editorRef as React.MutableRefObject<any>).current = editor;
      }
    }, [editor, ref, editorRef]);

    // Update editor content when content prop changes
    useEffect(() => {
      if (editor && editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    if (!editor) {
      return null;
    }

    return (
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="border-b p-2 flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-accent' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Link URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor.isActive('link') ? 'bg-accent' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
