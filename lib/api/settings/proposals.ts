import PocketBase from 'pocketbase';

/**
 * Initialize default proposal notification settings if they don't exist
 * This ensures the notification system has default configuration
 */
export async function initializeProposalNotificationSettings(pb: PocketBase): Promise<void> {
  try {
    // Check if settings already exist
    const existing = await pb.collection('app_settings').getList(1, 1, {
      filter: 'service_name = "proposal_notifications"',
    });

    if (existing.totalItems > 0) {
      console.log('[Proposal Notifications] Settings already exist');
      return;
    }

    // Create default settings
    await pb.collection('app_settings').create({
      service_name: 'proposal_notifications',
      setting_key: 'enabled',
      setting_value: 'true',
      description: 'Teklif cevapları için WhatsApp bildirimleri aktif',
      is_active: true,
    });

    await pb.collection('app_settings').create({
      service_name: 'proposal_notifications',
      setting_key: 'sales_phones',
      setting_value: '',
      description: 'Satış ekibi telefon numaraları (virgülle ayrılmış, örn: 905551234567,905551234568). Boş bırakılırsa kullanıcılardaki telefonlar kullanılır.',
      is_active: true,
    });

    console.log('[Proposal Notifications] Default settings initialized');
  } catch (error) {
    console.error('[Proposal Notifications] Failed to initialize settings:', error);
  }
}
