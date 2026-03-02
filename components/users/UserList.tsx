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
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Laptop, MoreVertical, Plus } from 'lucide-react';

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewSessions(user)}>
                      <Laptop className="mr-2 h-4 w-4" />
                      Oturumlar
                    </DropdownMenuItem>
                    {user.id !== currentUser?.id && (
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
