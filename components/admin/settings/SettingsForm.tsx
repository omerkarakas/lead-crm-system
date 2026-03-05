import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestBadge } from './TestBadge';
import { Settings2, Loader2, Eye, EyeOff } from 'lucide-react';
import type { ServiceName, Setting } from '@/types/setting';

interface SettingsFormProps {
  serviceName: ServiceName;
  serviceLabel: string;
  serviceDescription: string;
  settings: Setting[];
  testResult?: { success: boolean; message: string; timestamp?: number } | null;
  isTesting?: boolean;
  onUpdate: (id: string, value: string, isActive?: boolean) => Promise<void>;
  onTest: () => Promise<void>;
}

// Service-specific field configurations
const SERVICE_FIELDS: Record<
  ServiceName,
  { key: string; label: string; type: 'text' | 'password'; placeholder?: string }[]
> = {
  green_api: [
    { key: 'instance_id', label: 'Instance ID', type: 'text', placeholder: '1101' },
    { key: 'token', label: 'API Token', type: 'password', placeholder: 'edfedf91...' },
  ],
  calcom: [
    { key: 'url', label: 'Cal.com URL', type: 'text', placeholder: 'cal.mokadijital.com' },
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'dd19b9fc...' },
    { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'WCbDoO+i8...' },
    { key: 'booking_link_url', label: 'Booking Link URL', type: 'text', placeholder: 'https://cal.mokadijital.com/moka/30min' },
  ],
  resend: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 're_BdJfnXM3...' },
    { key: 'from_email', label: 'From Email', type: 'text', placeholder: 'bildirim@mokadijital.com' },
    { key: 'from_name', label: 'From Name', type: 'text', placeholder: 'Moka CRM' },
  ],
  proposal_notifications: [
    { key: 'enabled', label: 'Bildirimler Aktif', type: 'text', placeholder: 'true' },
    { key: 'sales_phones', label: 'Satış Ekibi Telefonları', type: 'text', placeholder: '905551234567,905551234568' },
  ],
};

export function SettingsForm({
  serviceName,
  serviceLabel,
  serviceDescription,
  settings,
  testResult,
  isTesting,
  onUpdate,
  onTest,
}: SettingsFormProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Create settings map for easy lookup
  const settingsMap: Record<string, Setting> = {};
  settings.forEach((s) => {
    settingsMap[s.setting_key] = s;
  });

  const fields = SERVICE_FIELDS[serviceName] || [];

  const handleSave = async (key: string) => {
    const value = editingValues[key];
    if (value === undefined || value === settingsMap[key]?.setting_value) return;

    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await onUpdate(settingsMap[key].id, value);
      setEditingValues((prev) => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleKeyDown = (key: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(key);
    }
  };

  const toggleShowPassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {serviceLabel}
            </CardTitle>
            <CardDescription className="mt-1">{serviceDescription}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <TestBadge result={testResult} isLoading={isTesting} />
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Test ediliyor...
                </>
              ) : (
                'Bağlantıyı Test Et'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const setting = settingsMap[field.key];
          const editValue = editingValues[field.key];
          const isSaving = saving[field.key];
          const hasChanges = editValue !== undefined && editValue !== setting?.setting_value;
          const showPassword = showPasswords[field.key];

          if (!setting) return null;

          return (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.key}>{field.label}</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) => onUpdate(setting.id, setting.setting_value, checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {setting.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.key}
                    type={field.type === 'password' && !showPassword ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    defaultValue={setting.setting_value}
                    onChange={(e) => setEditingValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    onKeyDown={(e) => handleKeyDown(field.key, e)}
                    disabled={isSaving}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(field.key)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Kaydet'
                    )}
                  </Button>
                )}
              </div>
              {setting.description && (
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
