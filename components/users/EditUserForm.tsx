'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Role, User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const editUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  role: z.nativeEnum(Role, { required_error: 'Lütfen bir rol seçin' }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserFormProps {
  user: User;
  onSubmit: (data: EditUserFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditUserForm({ user, onSubmit, onCancel, isSubmitting = false }: EditUserFormProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  useEffect(() => {
    form.reset({
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }, [user, form]);

  const handleSubmit = async (data: EditUserFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder="ornek@sirket.com" {...field} disabled />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">E-posta değiştirilemez</p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Ahmet Yılmaz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  <SelectItem value={Role.SALES}>Satış</SelectItem>
                  <SelectItem value={Role.MARKETING}>Pazarlama</SelectItem>
                </SelectContent>
              </Select>
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
            Değişiklikleri Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
}
