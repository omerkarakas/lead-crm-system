'use client';

import { Mail, MessageSquare, Clock, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
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
import { useState } from 'react';
import type { SequenceStep } from '@/types/campaign';

interface SequenceListProps {
  steps: SequenceStep[];
  onEditStep: (index: number) => void;
  onDeleteStep: (index: number) => void;
  onReorderStep: (from: number, to: number) => void;
}

export function SequenceList({
  steps,
  onEditStep,
  onDeleteStep,
  onReorderStep,
}: SequenceListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<{ index: number; step: SequenceStep } | null>(null);

  const handleDeleteClick = (index: number, step: SequenceStep) => {
    setStepToDelete({ index, step });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (stepToDelete) {
      onDeleteStep(stepToDelete.index);
      setDeleteDialogOpen(false);
      setStepToDelete(null);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'delay':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStepLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'whatsapp':
        return 'WhatsApp';
      case 'delay':
        return 'Gecikme';
      default:
        return type;
    }
  };

  const getStepTypeVariant = (type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (type) {
      case 'email':
        return 'default';
      case 'whatsapp':
        return 'secondary';
      case 'delay':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDelayDisplay = (step: SequenceStep): string => {
    if (step.type === 'delay') {
      if (step.delay_type === 'relative' && step.delay_minutes) {
        if (step.delay_minutes < 60) {
          return `${step.delay_minutes} dk`;
        } else if (step.delay_minutes < 1440) {
          const hours = Math.floor(step.delay_minutes / 60);
          return `${hours} saat`;
        } else {
          const days = Math.floor(step.delay_minutes / 1440);
          return `${days} gün`;
        }
      } else if (step.delay_type === 'absolute' && step.scheduled_time) {
        return new Date(step.scheduled_time).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
    return '-';
  };

  const getTemplateName = (step: SequenceStep): string => {
    if (step.type === 'email' || step.type === 'whatsapp') {
      return step.template_id ? `Şablon: ${step.template_id.slice(0, 8)}...` : '-';
    }
    return '-';
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Henüz adım eklenmedi</p>
        <Button variant="outline" onClick={() => onEditStep(-1)}>
          Adım Ekle
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Sıra</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>İçerik</TableHead>
              <TableHead>Gecikme</TableHead>
              <TableHead className="text-right w-40">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map((step, index) => (
              <TableRow key={step.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStepIcon(step.type)}
                    <Badge variant={getStepTypeVariant(step.type)}>
                      {getStepLabel(step.type)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {getTemplateName(step)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDelayDisplay(step)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onReorderStep(index, index - 1)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Yukarı Taşı</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onReorderStep(index, index + 1)}
                            disabled={index === steps.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Aşağı Taşı</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onEditStep(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Düzenle</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(index, step)}
                          >
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
            <AlertDialogTitle>Adımı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu adımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
