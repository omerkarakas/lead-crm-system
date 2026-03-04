'use client';

import { EmailTemplate } from '@/types/email';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Archive, RotateCcw, Mail } from 'lucide-react';

interface CardViewProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function CardView({
  templates,
  onEdit,
  onArchive,
  onRestore,
  onToggleActive,
}: CardViewProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Henüz şablon oluşturulmadı.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="relative">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate" title={template.name}>
                  {template.name}
                </CardTitle>
                <CardDescription className="truncate mt-1">
                  {template.subject}
                </CardDescription>
              </div>
              <Switch
                checked={template.is_active}
                onCheckedChange={(checked) => onToggleActive(template.id, checked)}
                className="ml-2"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Category Badge */}
              {template.category && (
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              )}

              {/* Body Preview */}
              <div
                className="text-sm text-muted-foreground line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: template.body,
                }}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                {template.is_deleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(template.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onArchive(template.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
