export type ServiceName = 'green_api' | 'calcom' | 'resend' | 'proposal_notifications';

export interface Setting {
  id: string;
  service_name: ServiceName;
  setting_key: string;
  setting_value: string;
  description?: string;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface CreateSettingDto {
  service_name: ServiceName;
  setting_key: string;
  setting_value: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSettingDto {
  setting_value?: string;
  description?: string;
  is_active?: boolean;
}

// Masked setting value for UI display (hides sensitive data)
export interface MaskedSetting extends Omit<Setting, 'setting_value'> {
  setting_value: string; // Masked value like "***key123"
  is_masked: boolean;
}
