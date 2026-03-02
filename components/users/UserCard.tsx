'use client';

import { User, Role } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Laptop } from 'lucide-react';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewSessions: (user: User) => void;
  currentUserId?: string;
}

export function UserCard({ user, onEdit, onDelete, onViewSessions, currentUserId }: UserCardProps) {
  const getRoleBadge = (role: Role) => {
    const variants: Record<Role, 'default' | 'secondary' | 'outline'> = {
      [Role.ADMIN]: 'default',
      [Role.SALES]: 'secondary',
      [Role.MARKETING]: 'outline',
    };

    const labels: Record<Role, string> = {
      [Role.ADMIN]: 'Admin',
      [Role.SALES]: 'Satış',
      [Role.MARKETING]: 'Pazarlama',
    };

    return (
      <Badge variant={variants[role]} className="font-medium">
        {labels[role]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{user.name}</CardTitle>
          {getRoleBadge(user.role)}
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Kayıt: {new Date(user.created).toLocaleDateString('tr-TR')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
            <Edit className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewSessions(user)}>
            <Laptop className="h-4 w-4 mr-1" />
            Oturumlar
          </Button>
          {user.id !== currentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(user)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Sil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
