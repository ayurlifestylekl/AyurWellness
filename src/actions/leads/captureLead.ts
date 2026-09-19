'use server'

import { createClient as createSb } from '@supabase/supabase-js'

export type LeadSource = 'welcome_popup' | 'whatsapp_gate'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,30}$/

/**
 * Capture a public lead (welcome popup / WhatsApp gate). Runs server-side with
 * the service role — the leads table is locked to service-role access.
 */
export async function captureLead(input: {
  name: string
  email: string
  phone: string
  source: LeadSource
}): Promise<{ ok: true } | { error: string }> {
  const name = (input.name ?? '').trim()
  const email = (input.email ?? '').trim()
  const phone = (input.phone ?? '').trim()

  if (name.length < 2 || name.length > 120) return { error: 'Please enter your name.' }
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'Please enter a valid email address.' }
  if (!PHONE_RE.test(phone)) return { error: 'Please enter a valid phone number.' }

  const source: 'welcome_popup' | 'whatsapp_gate' | 'unknown' =
    input.source === 'welcome_popup' || input.source === 'whatsapp_gate' ? input.source : 'unknown'

  const sb = createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await sb.from('leads').insert({ name, email, phone, source })
  if (error) {
    console.error('[captureLead]', error.message)
    return { error: 'Could not save your details — please try again.' }
  }
  return { ok: true }
}
