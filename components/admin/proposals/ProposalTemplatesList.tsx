'use client';

import { useState } from 'react';
import { ProposalTemplate, EditorType } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  Power,
  PowerOff,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ProposalTemplatesListProps {
  templates: ProposalTemplate[];
  archivedTemplates: ProposalTemplate[];
  loading?: boolean;
  onEdit: (template: ProposalTemplate) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function ProposalTemplatesList({
  templates,
  archivedTemplates,
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onToggleActive,
}: ProposalTemplatesListProps) {
  const [searchQuery, setSearchQuery] =('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredTemplates = (showArchived ? archivedTemplates : templates).filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getEditorTypeBadge = (type: EditorType) => {
    return type === EditorType.TIPTAP ? (
      <Badge variant="secondary">TipTap</Badge>
    ) : (
      <Badge variant="outline">Markdown</Badge>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">Aktif</Badge>
    ) : (
      <Badge variant="secondary">Pasif</Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Şablon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(false)}
          >
            Aktif Şablonlar
          </Button>
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(true)}
          >
            Arşivlenenler
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {showArchived
              ? 'Arşivlenen şablon bulunmuyor'
              : 'Şablon bulunmuyor'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Editör</TableHead>
                <TableHead>Değişkenler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onEdit(template)}
                >
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {template.description || '-'}
                  </TableCell>
                  <TableCell>{getEditorTypeBadge(template.editor_type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.variables?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>{getActiveBadge(template.is_active)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(template.created), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {showArchived ? (
                          <>
                            <DropdownMenuItem onClick={() => onRestore(template.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Geri Yükle
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(template)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onToggleActive(template.id, !template.is_active)
                              }
                            >
                              {template.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Pasife Al
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Aktife Et
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(template.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
