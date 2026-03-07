'use client';

import { QAQuestion } from '@/types/qa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Edit, Trash2, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface QuestionListProps {
  questions: QAQuestion[];
  loading: boolean;
  onEdit: (question: QAQuestion) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onReorder: (questions: QAQuestion[]) => Promise<void>;
}

export function QuestionList({
  questions,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: QuestionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QAQuestion | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QAQuestion | null>(null);

  const handleDeleteClick = (question: QAQuestion) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (questionToDelete) {
      await onDelete(questionToDelete.id);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const formatWhatsAppMessage = (question: QAQuestion) => {
    let message = `*${question.order}. ${question.question_text}*\n\n`;
    message += question.options.join('\n');
    return message;
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;

    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];

    // Update order values
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });

    await onReorder(newQuestions);
  };

  const moveDown = async (index: number) => {
    if (index === questions.length - 1) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];

    // Update order values
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });

    await onReorder(newQuestions);
  };

  if (questions.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Henüz soru oluşturulmadı.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Sıra</TableHead>
              <TableHead>Soru</TableHead>
              <TableHead>Seçenekler</TableHead>
              <TableHead>Puanlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question, index) => (
              <TableRow key={question.id}>
                <TableCell className="font-medium">{question.order}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={question.question_text}>
                    {question.question_text}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    {question.options.map((opt, i) => (
                      <div key={i} className="text-muted-foreground">
                        {opt}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {Object.entries(question.points).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={question.is_active}
                    onCheckedChange={(checked) => onToggleActive(question.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => moveUp(index)} disabled={index === 0 || loading}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Yukarı Taşı</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => moveDown(index)} disabled={index === questions.length - 1 || loading}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aşağı Taşı</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setPreviewQuestion(question)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>WhatsApp Önizleme</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEdit(question)} disabled={loading}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Düzenle</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(question)} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sil</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soruyu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <AlertDialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>WhatsApp Mesaj Önizleme</AlertDialogTitle>
          </AlertDialogHeader>
          {previewQuestion && (
            <div className="bg-slate-50 border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {formatWhatsAppMessage(previewQuestion)}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Kapat</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
