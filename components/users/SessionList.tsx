'use client';

import { useState, useEffect } from 'react';
import { User, Session } from '@/types/user';
import { fetchSessions, revokeSession, revokeAllOtherSessions } from '@/lib/api/users';
import { useAuthStore } from '@/lib/stores/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Laptop, X, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface SessionListProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionList({ user, open, onOpenChange }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();

  const isOwnSessions = currentUser?.id === user.id;

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open, user.id]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await fetchSessions(user.id);
      setSessions(data);
    } catch (error: any) {
      toast.error(error.message || 'Oturumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Oturum iptal edildi');
    } catch (error: any) {
      toast.error(error.message || 'Oturum iptal edilirken hata oluştu');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevoking('all');
    try {
      await revokeAllOtherSessions(user.id);
      setSessions((prev) => {
        const currentToken = localStorage.getItem('pb_auth');
        return prev.filter((s) => s.token === currentToken);
      });
      toast.success('Diğer oturumlar iptal edildi');
    } catch (error: any) {
      toast.error(error.message || 'Oturumlar iptal edilirken hata oluştu');
    } finally {
      setRevoking(null);
    }
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return '📱';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return '📱';
    }
    return '💻';
  };

  const getCurrentSessionId = () => {
    // This is a simplified check - in production you'd track the actual session ID
    const pbAuth = localStorage.getItem('pb_auth');
    if (pbAuth) {
      try {
        const auth = JSON.parse(pbAuth);
        return sessions.find((s) => s.token === auth.token)?.id;
      } catch {
        return null;
      }
    }
    return null;
  };

  const currentSessionId = getCurrentSessionId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5" />
            {isOwnSessions ? 'Oturumlarınız' : `${user.name} - Oturumlar`}
          </DialogTitle>
          <DialogDescription>
            {isOwnSessions
              ? 'Açık oturumlarınızı görüntüleyin ve yönetin'
              : 'Kullanıcının aktif oturumlarını görüntüleyin'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aktif oturum bulunmuyor</p>
          ) : (
            <>
              {isOwnSessions && sessions.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRevokeAll}
                  disabled={revoking === 'all'}
                >
                  {revoking === 'all' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Diğer Oturumları İptal Et
                </Button>
              )}

              {sessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDeviceIcon(session.userAgent)}</span>
                      <div>
                        <p className="font-medium">
                          {session.deviceName || 'Bilinmeyen Cihaz'}
                          {isCurrent && (
                            <Badge variant="secondary" className="ml-2">
                              Şu anki
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Son aktivite: {formatLastActive(session.lastActive)}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.ip}</p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revoking === session.id}
                      >
                        {revoking === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
