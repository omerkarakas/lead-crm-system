'use client';

import { useState, useEffect, useCallback } from 'react';
import { Note, CreateNoteDto } from '@/types/lead';
import * as notesApi from '@/lib/api/leads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotesSectionProps {
  leadId: string;
}

export function NotesSection({ leadId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedNotes = await notesApi.getNotes(leadId);
      setNotes(fetchedNotes);
    } catch (error: any) {
      toast.error('Notlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmitNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSubmitting(true);
      const noteData: CreateNoteDto = {
        leadId,
        content: newNote,
      };
      const createdNote = await notesApi.addNote(noteData);

      // Optimistic update
      setNotes((prev) => [createdNote, ...prev]);
      setNewNote('');
      toast.success('Not eklendi');
    } catch (error: any) {
      toast.error(error.message || 'Not eklenirken hata oluştu');
      // Refresh notes on error to ensure consistency
      fetchNotes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesApi.deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      toast.success('Not silindi');
    } catch (error: any) {
      toast.error('Not silinirken hata oluştu');
      fetchNotes();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notlar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Yeni not ekleyin..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitNote}
              disabled={!newNote.trim() || submitting}
              size="sm"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Not Ekle
            </Button>
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Henüz not eklenmemiş
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {note.expand?.userId?.name || 'Bilinmeyen Kullanıcı'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
