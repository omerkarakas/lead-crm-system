'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordContent() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Şifre Sıfırla</CardTitle>
          <CardDescription>
            Yeni şifrenizi girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetPasswordForm />
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => router.push('/login')}
            >
              Giriş sayfasına dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">Yükleniyor...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
