'use client';

import { useRouter } from 'next/navigation';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
          <CardDescription>
            Şifrenizi sıfırlamak için e-posta adresinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
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
