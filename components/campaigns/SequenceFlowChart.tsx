'use client';

import { Mail, MessageSquare, Clock, ArrowDown, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { SequenceStep } from '@/types/campaign';

interface SequenceFlowChartProps {
  steps: SequenceStep[];
  onEditStep: (index: number) => void;
  onDeleteStep: (index: number) => void;
}

export function SequenceFlowChart({
  steps,
  onEditStep,
  onDeleteStep,
}: SequenceFlowChartProps) {
  const getStepIcon = (type: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (type) {
      case 'email':
        return <Mail {...iconProps} />;
      case 'whatsapp':
        return <MessageSquare {...iconProps} />;
      case 'delay':
        return <Clock {...iconProps} />;
      default:
        return null;
    }
  };

  const getStepLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Adımı';
      case 'whatsapp':
        return 'WhatsApp Adımı';
      case 'delay':
        return 'Gecikme Adımı';
      default:
        return type;
    }
  };

  const getStepColor = (type: string): string => {
    switch (type) {
      case 'email':
        return 'bg-blue-50 border-blue-200 hover:border-blue-400';
      case 'whatsapp':
        return 'bg-green-50 border-green-200 hover:border-green-400';
      case 'delay':
        return 'bg-gray-50 border-gray-200 hover:border-gray-400';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getIconBgColor = (type: string): string => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-600';
      case 'whatsapp':
        return 'bg-green-100 text-green-600';
      case 'delay':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
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
          return `${step.delay_minutes} dakika sonra`;
        } else if (step.delay_minutes < 1440) {
          const hours = Math.floor(step.delay_minutes / 60);
          return `${hours} saat sonra`;
        } else {
          const days = Math.floor(step.delay_minutes / 1440);
          return `${days} gün sonra`;
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
    return 'Hemen';
  };

  const getTemplateName = (step: SequenceStep): string => {
    if (step.type === 'email' || step.type === 'whatsapp') {
      return step.template_id ? `Şablon ID: ${step.template_id.slice(0, 8)}...` : 'Şablon seçilmedi';
    }
    return '-';
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/20">
        <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg mb-2">Henüz adım eklenmedi</p>
        <p className="text-muted-foreground text-sm mb-6">
          Sıranı oluşturmak için ilk adımı ekleyin
        </p>
        <Button variant="outline" onClick={() => onEditStep(-1)}>
          İlk Adımı Ekle
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <TooltipProvider>
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Step Card */}
            <Card className={`mb-0 transition-all duration-200 ${getStepColor(step.type)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getIconBgColor(step.type)}`}>
                      {getStepIcon(step.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{getStepLabel(step.type)}</h3>
                        <Badge variant={getBadgeVariant(step.type)}>
                          Adım {index + 1}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDelayDisplay(step)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
                          onClick={() => onDeleteStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sil</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>

              {(step.type === 'email' || step.type === 'whatsapp') && (
                <CardContent className="pt-0 pb-3">
                  <div className="bg-white/50 rounded-md p-3 border">
                    <p className="text-sm font-medium mb-1">
                      {step.type === 'email' ? 'Email Şablonu' : 'WhatsApp Şablonu'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getTemplateName(step)}
                    </p>
                  </div>
                </CardContent>
              )}

              {step.type === 'delay' && (
                <CardContent className="pt-0 pb-3">
                  <div className="bg-white/50 rounded-md p-3 border">
                    <p className="text-sm font-medium mb-1">
                      {step.delay_type === 'relative' ? 'Gecikme Süresi' : 'Zamanlama'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.delay_type === 'relative'
                        ? `Bu adımdan ${formatDelayDisplay(step)} sonraki adıma geçilir`
                        : `Belirtilen zamanda: ${step.scheduled_time ? new Date(step.scheduled_time).toLocaleString('tr-TR') : '-'}`}
                    </p>
                  </div>
                </CardContent>
              )}

              <CardFooter className="pt-0 pb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID: {step.id.slice(0, 8)}...</span>
                </div>
              </CardFooter>
            </Card>

            {/* Connecting Arrow (not for last step) */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    Sonraki Adım
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </TooltipProvider>

      {/* End Indicator */}
      <div className="flex justify-center py-6">
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">Sıra Sonu</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
