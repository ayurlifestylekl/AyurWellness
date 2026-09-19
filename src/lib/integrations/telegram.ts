import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'

function admin() {
  return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
  })
}

export interface TelegramConfig {
  token: string | null
  chatId: string | null
}

/** Telegram bot config (service-role read — used by the notifier). */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  const { data } = await admin()
    .from('integration_settings')
    .select('telegram_bot_token, telegram_chat_id')
    .eq('id', 1)
    .maybeSingle()
  return { token: data?.telegram_bot_token ?? null, chatId: data?.telegram_chat_id ?? null }
}

/**
 * Send a Telegram message to the configured staff chat. Fire-and-forget: a
 * missing config or a Telegram outage is a silent no-op and never throws, so it
 * can never block or fail a booking.
 */
export async function sendTelegram(text: string): Promise<void> {
  try {
    const { token, chatId } = await getTelegramConfig()
    if (!token || !chatId) return
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      cache: 'no-store',
    })
    if (!res.ok) console.error('[telegram] sendMessage failed:', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('[telegram] send error:', e)
  }
}

export interface DetectedChat {
  id: string
  title: string
}

/**
 * Read the bot's recent updates and list the chats that have messaged it — so
 * the admin can pick the staff group's chat ID without touching a raw URL.
 */
export async function detectChats(token: string): Promise<{ chats: DetectedChat[] } | { error: string }> {
  const clean = token.trim()
  if (!clean) return { error: 'Enter the bot token first.' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${clean}/getUpdates`, { cache: 'no-store' })
    const json = (await res.json()) as {
      ok: boolean
      description?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any[]
    }
    if (!json.ok) return { error: json.description || 'Telegram rejected the token.' }

    const byId = new Map<string, string>()
    for (const u of json.result ?? []) {
      const chat = u?.message?.chat ?? u?.channel_post?.chat ?? u?.my_chat_member?.chat
      if (!chat?.id) continue
      const title = chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(' ') ?? chat.username ?? 'Chat'
      byId.set(String(chat.id), title)
    }
    const chats = Array.from(byId, ([id, title]) => ({ id, title }))
    if (chats.length === 0) {
      return { error: 'No messages yet. Add the bot to your group and send “/start@YourBot”, then try again.' }
    }
    return { chats }
  } catch {
    return { error: 'Could not reach Telegram — please try again.' }
  }
}
