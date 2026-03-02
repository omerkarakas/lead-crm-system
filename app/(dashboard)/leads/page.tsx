'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeadsPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Moka CRM</h1>
            <p className="text-muted-foreground">Lead Yönetimi</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Çıkış Yap
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoş Geldiniz!</CardTitle>
            <CardDescription>
              Moka CRM sistemine başarıyla giriş yaptınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Lead yönetim özellikleri yakında eklenecektir. Şu anda temel kimlik doğrulama sistemi çalışıyor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
