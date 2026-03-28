'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageUsers } from '@/lib/utils/permissions';
import { UserManagementList } from '@/components/users/UserManagementList';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  // Redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Check permissions
  if (!canManageUsers(user.role)) {
    router.push('/dashboard');
    return null;
  }

  return <UserManagementList />;
}
