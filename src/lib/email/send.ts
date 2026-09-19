import 'server-only'
import { sendMail } from './client'
import { createClient as adminClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type EmailCategory =
  | 'transactional'   // order confirmation, ticket reply, account deletion — always sent
  | 'reminder'        // appointment reminders — respects email_reminders_opt_in
  | 'marketing'       // newsletter, promotions — respects marketing_opt_in

interface SendEmailInput {
  to: string
  category: EmailCategory
  subject: string
  html: string
  text: string
  /** If provided, looks up the user's opt-in preferences before sending. */
  userId?: string
}

let cachedAdmin: SupabaseClient<Database> | null = null
function admin(): SupabaseClient<Database> {
  if (cachedAdmin) return cachedAdmin
  cachedAdmin = adminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return cachedAdmin
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  if (input.category !== 'transactional' && input.userId) {
    const { data } = await admin().from('users')
      .select('email_reminders_opt_in, marketing_opt_in')
      .eq('id', input.userId).single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = data as any
    if (input.category === 'reminder' && u && !u.email_reminders_opt_in) {
      return { sent: false, reason: 'reminders_opt_out' }
    }
    if (input.category === 'marketing' && u && !u.marketing_opt_in) {
      return { sent: false, reason: 'marketing_opt_out' }
    }
  }

  try {
    await sendMail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    return { sent: true }
  } catch {
    console.error('[email/send] delivery failed')
    return { sent: false, reason: 'send_failed' }
  }
}
