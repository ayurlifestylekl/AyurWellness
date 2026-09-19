import type { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessSettings {
  clinic_name: string
  address: string
  phone: string
  email: string
  whatsapp: string
  hours: string
  instagram_url: string
}

export interface CommerceSettings {
  tax_rate_percent: number
  default_shipping_rm: number
  free_shipping_threshold_rm: number
  currency: string
}

export interface BookingSettings {
  lead_time_hours: number
  max_window_days: number
  gender_policy_enabled: boolean
}

export interface NotificationSettings {
  admin_notify_email: string
  low_stock_threshold: number
}

export interface SiteSettings {
  business: BusinessSettings
  commerce: CommerceSettings
  booking: BookingSettings
  notifications: NotificationSettings
  updatedAt: string | null
}

const DEFAULTS: SiteSettings = {
  updatedAt: null,
  business: {
    clinic_name: 'Ayurvedic Wellness Centre',
    address: 'No. 68-G, Jalan Tun Sambanthan, Brickfields, 50470 Kuala Lumpur',
    phone: '+603 2260 3435',
    email: 'admin@ayurvedawellness.com.my',
    whatsapp: '+6011-6339 3436',
    hours: 'Mon-Sat 10:00-19:00, Sun closed',
    instagram_url: '',
  },
  commerce: {
    tax_rate_percent: 6,
    default_shipping_rm: 10,
    free_shipping_threshold_rm: 200,
    currency: 'RM',
  },
  booking: {
    lead_time_hours: 24,
    max_window_days: 30,
    gender_policy_enabled: true,
  },
  notifications: {
    admin_notify_email: 'admin@ayurvedawellness.com.my',
    low_stock_threshold: 5,
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TelegramSettings {
  token: string | null
  chatId: string | null
}

/** Telegram integration config (admin-only table; is_admin RLS). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTelegramSettings(supabase: SupabaseClient<any>): Promise<TelegramSettings> {
  const { data } = await supabase
    .from('integration_settings')
    .select('telegram_bot_token, telegram_chat_id')
    .eq('id', 1)
    .maybeSingle()
  return { token: data?.telegram_bot_token ?? null, chatId: data?.telegram_chat_id ?? null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSiteSettings(supabase: SupabaseClient<any>): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('business, commerce, booking, notifications, updated_at')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return DEFAULTS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = data
  return {
    business: { ...DEFAULTS.business, ...(row.business ?? {}) },
    commerce: { ...DEFAULTS.commerce, ...(row.commerce ?? {}) },
    booking: { ...DEFAULTS.booking, ...(row.booking ?? {}) },
    notifications: { ...DEFAULTS.notifications, ...(row.notifications ?? {}) },
    updatedAt: row.updated_at ?? null,
  }
}

export { DEFAULTS as DEFAULT_SETTINGS }
