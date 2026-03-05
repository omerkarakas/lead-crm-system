'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { canManageSettings } from '@/lib/utils/permissions';
import { useSettingsStore, useServiceSettings } from '@/lib/stores/settings';
import { SettingsForm } from '@/components/admin/settings/SettingsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ServiceName } from '@/types/setting';

export default function AdminSettingsPage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const { settings, loading, error, fetchSettings, updateSetting, testConnection, clearError } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<ServiceName>('green_api');
  const [testingService, setTestingService] = useState<ServiceName | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

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
  if (!canManageSettings(user.role)) {
    router.push('/leads');
    return null;
  }

  const handleUpdate = async (id: string, value: string, isActive?: boolean) => {
    clearError();
    try {
      await updateSetting(id, { setting_value: value, ...(isActive !== undefined && { is_active: isActive }) });
      toast.success('Ayar güncellendi');
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    }
  };

  const handleTest = async (service: ServiceName) => {
    clearError();
    setTestingService(service);
    try {
      await testConnection(service);
      toast.success('Bağlantı testi başarılı');
    } catch (error: any) {
      toast.error(error.message || 'Bağlantı testi başarısız');
    } finally {
      setTestingService(null);
    }
  };

  const greenApiSettings = useServiceSettings('green_api');
  const calcomSettings = useServiceSettings('calcom');
  const resendSettings = useServiceSettings('resend');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Sistem Ayarları
          </h1>
          <p className="text-muted-foreground mt-1">
            API credentials ve servis ayarlarını yönetin
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchSettings()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Service Settings Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceName)}>
        <TabsList>
          <TabsTrigger value="green_api">Green API (WhatsApp)</TabsTrigger>
          <TabsTrigger value="calcom">Cal.com</TabsTrigger>
          <TabsTrigger value="resend">Resend (Email)</TabsTrigger>
        </TabsList>

        <TabsContent value="green_api" className="mt-4">
          <SettingsForm
            serviceName="green_api"
            serviceLabel="Green API (WhatsApp)"
            serviceDescription="WhatsApp mesaj gönderimi için Green API credentials"
            settings={greenApiSettings}
            testResult={null}
            isTesting={testingService === 'green_api'}
            onUpdate={handleUpdate}
            onTest={() => handleTest('green_api')}
          />
        </TabsContent>

        <TabsContent value="calcom" className="mt-4">
          <SettingsForm
            serviceName="calcom"
            serviceLabel="Cal.com"
            serviceDescription="Randevu yönetimi için Cal.com credentials"
            settings={calcomSettings}
            testResult={null}
            isTesting={testingService === 'calcom'}
            onUpdate={handleUpdate}
            onTest={() => handleTest('calcom')}
          />
        </TabsContent>

        <TabsContent value="resend" className="mt-4">
          <SettingsForm
            serviceName="resend"
            serviceLabel="Resend"
            serviceDescription="E-posta gönderimi için Resend credentials"
            settings={resendSettings}
            testResult={null}
            isTesting={testingService === 'resend'}
            onUpdate={handleUpdate}
            onTest={() => handleTest('resend')}
          />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Hata</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
