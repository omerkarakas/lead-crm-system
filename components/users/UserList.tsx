'use client';

import { User, Role } from '@/types/user';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, Edit, Laptop, Plus, Trash2 } from 'lucide-react';

interface UserListProps {
  users: User[];
  loading: boolean;
  currentUser?: User | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewSessions: (user: User) => void;
  onCreateUser?: () => void;
}

export function UserList({
  users,
  loading,
  currentUser,
  onEdit,
  onDelete,
  onViewSessions,
  onCreateUser,
}: UserListProps) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Henüz kullanıcı bulunmuyor</p>
          {onCreateUser && (
            <Button onClick={onCreateUser}>
              <Plus className="mr-2 h-4 w-4" />
              İlk Kullanıcıyı Oluştur
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad Soyad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                {new Date(user.created).toLocaleDateString('tr-TR')}
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Düzenle</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onViewSessions(user)}>
                          <Laptop className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Oturumlar</TooltipContent>
                    </Tooltip>

                    {user.id !== currentUser?.id && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sil</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
