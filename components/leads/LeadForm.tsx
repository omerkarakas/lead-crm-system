'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LeadStatus, LeadSource } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';

const leadFormSchema = z
  .object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
    phone: z.string().min(10, 'Geçerli bir telefon numarası girin'),
    email: z.string().email('Geçerli bir e-posta adresi girin').optional().or(z.literal('')),
    company: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
    website: z.string().optional(),
    message: z.string().optional(),
    source: z.nativeEnum(LeadSource, { required_error: 'Lütfen bir kaynak seçin' }),
    status: z.nativeEnum(LeadStatus, { required_error: 'Lütfen bir durum seçin' }),
    tags: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      // Website boşsa geç
      if (!data.website || data.website.trim() === '') {
        return true;
      }
      // Protokol yoksa ekle ve kontrol et
      let urlToCheck = data.website.trim();
      if (!urlToCheck.match(/^https?:\/\//i)) {
        urlToCheck = 'https://' + urlToCheck;
      }
      try {
        new URL(urlToCheck);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Geçerli bir website adresi girin (örn: google.com)',
      path: ['website'],
    }
  );

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onSubmit: (data: LeadFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<LeadFormValues>;
  mode?: 'create' | 'edit';
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Yeni',
  [LeadStatus.QUALIFIED]: 'Uygun',
  [LeadStatus.BOOKED]: 'Randevu',
  [LeadStatus.CUSTOMER]: 'Müşteri',
  [LeadStatus.LOST]: 'Kayıp',
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.WEB_FORM]: 'Web Formu',
  [LeadSource.API]: 'API',
  [LeadSource.MANUAL]: 'Manuel',
  [LeadSource.WHATSAPP]: 'WhatsApp',
};

export function LeadForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultValues,
  mode = 'create',
}: LeadFormProps) {
  const [tagInput, setTagInput] = useState('');

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      company: '',
      website: '',
      message: '',
      source: LeadSource.MANUAL,
      status: LeadStatus.NEW,
      tags: [],
      ...defaultValues,
    },
  });

  const { fields: tagsFields, append: appendTag, remove: removeTag } = {
    fields: form.watch('tags').map((tag, index) => ({ id: index.toString(), value: tag })),
    append: (tag: string) => form.setValue('tags', [...form.getValues('tags'), tag]),
    remove: (index: number) => {
      const currentTags = form.getValues('tags');
      form.setValue(
        'tags',
        currentTags.filter((_, i) => i !== index)
      );
    },
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues('tags').includes(tag)) {
      appendTag(tag);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (data: LeadFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad *</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmet Yılmaz" {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input placeholder="+90 555 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input placeholder="ahmet@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şirket</FormLabel>
                <FormControl>
                  <Input placeholder="Şirket A.Ş." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="google.com veya https://www.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kaynak *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kaynak seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Etiketler</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Etiket ekle..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch('tags').map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <FormDescription>
                Enter tuşuna basarak etiket ekleyebilirsiniz
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesaj</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Lead hakkında notlar..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Lead Oluştur' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
