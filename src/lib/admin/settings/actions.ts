'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { detectChats } from '@/lib/integrations/telegram'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

const SettingsSchema = z.object({
  business: z.object({
    clinic_name: z.string().min(1),
    address: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    whatsapp: z.string().default(''),
    hours: z.string().default(''),
    instagram_url: z.string().default(''),
  }),
  commerce: z.object({
    tax_rate_percent: z.coerce.number().min(0).max(100),
    default_shipping_rm: z.coerce.number().min(0),
    free_shipping_threshold_rm: z.coerce.number().min(0),
    currency: z.string().min(1).default('RM'),
  }),
  booking: z.object({
    lead_time_hours: z.coerce.number().int().min(0),
    max_window_days: z.coerce.number().int().min(1),
    gender_policy_enabled: z.boolean(),
  }),
  notifications: z.object({
    admin_notify_email: z.string().email().or(z.literal('')),
    low_stock_threshold: z.coerce.number().int().min(0),
  }),
})

export async function updateSiteSettings(
  input: unknown,
): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const parsed = SettingsSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('site_settings') as any)
      .update({
        business: parsed.data.business,
        commerce: parsed.data.commerce,
        booking: parsed.data.booking,
        notifications: parsed.data.notifications,
        updated_by: me.profile.id,
      })
      .eq('id', 1)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/settings')
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

/* ── Telegram integration ───────────────────────────────────────────── */

export async function saveTelegramSettings(input: { token: string; chatId: string }): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('integration_settings') as any)
      .update({ telegram_bot_token: input.token.trim() || null, telegram_chat_id: input.chatId.trim() || null })
      .eq('id', 1)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/settings')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function detectTelegramChatId(
  token: string,
): Promise<ActionResult<{ chats: { id: string; title: string }[] }>> {
  try {
    await requireAdminSession()
    const res = await detectChats(token)
    if ('error' in res) return { ok: false, error: res.error }
    return { ok: true, data: { chats: res.chats } }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
