'use client';

import { useState, useEffect } from 'react';
import { User, Role } from '@/types/user';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
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
import { Loader2, Edit, Trash2, Laptop, MoreVertical } from 'lucide-react';
import { UserModal } from './UserModal';
import { DeleteConfirmation } from './DeleteConfirmation';
import { SessionList } from './SessionList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserModalMode = 'create' | 'edit';

export function UserList() {
  const { users, loading, fetchUsers, deleteUser } = useUsersStore();
  const { user: currentUser } = useAuthStore();
  const [modalMode, setModalMode] = useState<UserModalMode>('create');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(undefined);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteUserOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        setDeleteUserOpen(false);
      } catch (error: any) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleViewSessions = (user: User) => {
    setSessionUser(user);
    setIsSessionModalOpen(true);
  };

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
          <Button onClick={handleCreateUser}>İlk Kullanıcıyı Oluştur</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewSessions(user)}>
                        <Laptop className="mr-2 h-4 w-4" />
                        Oturumlar
                      </DropdownMenuItem>
                      {user.id !== currentUser?.id && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(user)}
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

      <UserModal
        mode={modalMode}
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <DeleteConfirmation
        user={userToDelete}
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        onConfirm={handleDeleteConfirm}
      />

      {sessionUser && (
        <SessionList
          user={sessionUser}
          open={isSessionModalOpen}
          onOpenChange={setIsSessionModalOpen}
        />
      )}
    </>
  );
}
