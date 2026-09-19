'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { sendEmail } from '@/lib/email/send'
import { accountDeletionEmail } from '@/lib/email/templates/accountDeletion'

type Result = { ok: true } | { ok: false; error: string }

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT'

export async function requestAccountDeletion(confirm: string): Promise<Result> {
  if (confirm.trim() !== CONFIRM_PHRASE) {
    return { ok: false, error: `Type "${CONFIRM_PHRASE}" exactly to confirm.` }
  }
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }
  const supabase = await createClient()

  const now = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('users') as any)
    .update({
      deleted_at: now,
      deletion_requested_at: now,
      full_name: 'Deleted user',
      email: null,
      phone_number: null,
      avatar_url: null,
      date_of_birth: null,
      allergies: null,
      current_medications: null,
      medical_conditions: null,
      marketing_opt_in: false,
      whatsapp_reminders_opt_in: false,
      email_reminders_opt_in: false,
      treatment_followups_opt_in: false,
    })
    .eq('id', me.authId)

  if (error) {
    console.error('[requestAccountDeletion] failed:', error.message)
    return { ok: false, error: 'Could not process deletion. Please contact support.' }
  }

  // Send confirmation email BEFORE signing out (we need the user's original email).
  if (me.email) {
    const firstName = me.profile.full_name?.split(' ')[0] ?? 'there'
    const cooloffEnds = new Date(Date.now() + 30 * 86400 * 1000)
      .toLocaleDateString('en-MY', { dateStyle: 'long' })
    const t = accountDeletionEmail({ firstName, cooloffEndsLocal: cooloffEnds })
    await sendEmail({ to: me.email, category: 'transactional', ...t })
  }

  await supabase.auth.signOut()
  redirect('/')
}
