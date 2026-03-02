'use client';

import { useState } from 'react';
import { User, CreateUserDto, UpdateUserDto, Role } from '@/types/user';
import { CreateUserForm } from './CreateUserForm';
import { EditUserForm } from './EditUserForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUsersStore } from '@/lib/stores/users';

type UserModalMode = 'create' | 'edit';

interface UserModalProps {
  mode: UserModalMode;
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserModal({ mode, user, open, onOpenChange }: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUser, updateUser } = useUsersStore();

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createUser(data as CreateUserDto);
        toast.success('Kullanıcı başarıyla oluşturuldu');
      } else if (user) {
        await updateUser(user.id, data as UpdateUserDto);
        toast.success('Kullanıcı başarıyla güncellendi');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'create' ? 'Yeni Kullanıcı' : 'Kullanıcı Düzenle';
  const description =
    mode === 'create'
      ? 'Sisteme yeni bir kullanıcı ekleyin'
      : 'Kullanıcı bilgilerini düzenleyin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {mode === 'create' ? (
          <CreateUserForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        ) : user ? (
          <EditUserForm
            user={user}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
