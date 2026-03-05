'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { canManageUsers, canManageQAQuestions, canManageEmailTemplates, canManageSettings } from '@/lib/utils/permissions';
import { Role } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Calendar,
  Megaphone,
  MessageSquare,
  Mail,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: (role: Role) => boolean;
}

const navItems: NavItem[] = [
  {
    href: '/leads',
    label: 'Müşteri Adayları',
    icon: <LayoutDashboard className="h-4 w-4" />,
    permission: () => true, // All users can access leads
  },
  {
    href: '/admin/qa',
    label: 'Nitelik Soruları',
    icon: <MessageSquare className="h-4 w-4" />,
    permission: canManageQAQuestions,
  },
  {
    href: '/admin/email-templates',
    label: 'E-posta Şablonları',
    icon: <Mail className="h-4 w-4" />,
    permission: canManageEmailTemplates,
  },
  {
    href: '/admin/settings',
    label: 'Ayarlar',
    icon: <Settings className="h-4 w-4" />,
    permission: canManageSettings,
  },
  {
    href: '/users',
    label: 'Kullanıcılar',
    icon: <Users className="h-4 w-4" />,
    permission: canManageUsers,
  },
  {
    href: '/appointments',
    label: 'Randevular',
    icon: <Calendar className="h-4 w-4" />,
    permission: () => true,
  },
  {
    href: '/campaigns',
    label: 'Kampanyalar',
    icon: <Megaphone className="h-4 w-4" />,
    permission: (role) => role === Role.ADMIN || role === Role.MARKETING,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || (user && item.permission(user.role))
  );

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/leads" className="flex items-center gap-2" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-lg">Moka CRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64">
        <Sidebar onClose={onClose} />
      </div>
    </div>
  );
}
