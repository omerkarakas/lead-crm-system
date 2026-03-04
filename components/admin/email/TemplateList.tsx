'use client';

import { useState } from 'react';
import { EmailTemplate } from '@/types/email';
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
import { Switch } from '@/components/ui/switch';
import { Edit, Archive, RotateCcw, Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ViewToggle } from './ViewToggle';
import { CardView } from './CardView';

interface TemplateListProps {
  templates: EmailTemplate[];
  archivedTemplates: EmailTemplate[];
  categories: string[];
  loading: boolean;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onEdit: (template: EmailTemplate) => void;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function TemplateList({
  templates,
  archivedTemplates,
  categories,
  loading,
  viewMode,
  onViewModeChange,
  onEdit,
  onArchive,
  onRestore,
  onToggleActive,
}: TemplateListProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter templates based on search and category
  const filteredTemplates = (showArchived ? archivedTemplates : templates).filter(
    (template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || template.category === categoryFilter;

      return matchesSearch && matchesCategory;
    }
  );

  // Strip HTML for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Table View
  const TableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şablon Adı</TableHead>
            <TableHead>Konu</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>İçerik Önizleme</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTemplates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{template.subject}</TableCell>
              <TableCell>
                {template.category && (
                  <Badge variant="outline">{template.category}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm text-muted-foreground">
                  {stripHtml(template.body)}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={template.is_active}
                  onCheckedChange={(checked) => onToggleActive(template.id, checked)}
                  disabled={loading}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(template)}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {template.is_deleted ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRestore(template.id)}
                      disabled={loading}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onArchive(template.id)}
                      disabled={loading}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Görünüm:</span>
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Şablon adı veya konu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Archived Toggle */}
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? 'Aktif Şablonlar' : 'Arşivlenenler'}
        </Button>
      </div>

      {/* Content */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || categoryFilter !== 'all'
              ? 'Arama kriterlerine uygun şablon bulunamadı.'
              : showArchived
              ? 'Arşivlenen şablon yok.'
              : 'Henüz şablon oluşturulmadı.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <TableView />
      ) : (
        <CardView
          templates={filteredTemplates}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onToggleActive={onToggleActive}
        />
      )}
    </div>
  );
}
