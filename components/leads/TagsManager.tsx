'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import * as leadsApi from '@/lib/api/leads';
import { useLeadsStore } from '@/lib/stores/leads';

interface TagsManagerProps {
  leadId: string;
  currentTags: string[];
}

export function TagsManager({ leadId, currentTags }: TagsManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchLead } = useLeadsStore();

  // Update local state when prop changes
  useEffect(() => {
    setTags(currentTags);
  }, [currentTags]);

  const handleAddTag = async () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (tags.includes(tag)) {
      toast.error('Bu etiket zaten mevcut');
      return;
    }

    try {
      setLoading(true);
      const updatedTags = [...tags, tag];
      await leadsApi.updateLead(leadId, { tags: updatedTags });
      setTags(updatedTags);
      setTagInput('');
      toast.success('Etiket eklendi');
    } catch (error: any) {
      toast.error(error.message || 'Etiket eklenirken hata oluştu');
      // Refresh to get accurate state
      refreshLead();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      setLoading(true);
      const updatedTags = tags.filter((tag) => tag !== tagToRemove);
      await leadsApi.updateLead(leadId, { tags: updatedTags });
      setTags(updatedTags);
      toast.success('Etiket silindi');
    } catch (error: any) {
      toast.error(error.message || 'Etiket silinirken hata oluştu');
      refreshLead();
    } finally {
      setLoading(false);
    }
  };

  const refreshLead = async () => {
    try {
      const lead = await fetchLead(leadId);
      setTags(lead.tags);
    } catch (error) {
      // Ignore refresh errors
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Etiketler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Tag Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Etiket ekle..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            onClick={handleAddTag}
            disabled={!tagInput.trim() || loading}
            size="icon"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Tags List */}
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz etiket eklenmemiş</p>
          ) : (
            tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pl-2">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={loading}
                  className="hover:bg-destructive/20 rounded-full p-0.5 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
