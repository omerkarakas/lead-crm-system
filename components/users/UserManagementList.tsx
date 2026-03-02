'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { useUsersStore } from '@/lib/stores/users';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserList } from './UserList';
import { UserModal } from './UserModal';
import { DeleteConfirmation } from './DeleteConfirmation';
import { SessionList } from './SessionList';

type UserModalMode = 'create' | 'edit';

export function UserManagementList() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { users, loading, fetchUsers, deleteUser } = useUsersStore();
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kullanıcılar</h1>
            <p className="text-muted-foreground">
              Sistem kullanıcılarını yönetin, roller atayın ve oturumları görüntüleyin.
            </p>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        </div>

        <UserList
          users={users}
          loading={loading}
          currentUser={currentUser}
          onEdit={handleEditUser}
          onDelete={handleDeleteClick}
          onViewSessions={handleViewSessions}
          onCreateUser={handleCreateUser}
        />
      </div>

      <UserModal
        mode={modalMode}
        user={selectedUser}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <DeleteConfirmation user={userToDelete} open={deleteUserOpen} onOpenChange={setDeleteUserOpen} onConfirm={handleDeleteConfirm} />

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