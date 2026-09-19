'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getPublicPromoByCode, hasGrant } from '@/lib/promos/queries'

export type ClaimErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'empty'
  | 'not_found'
  | 'expired'
  | 'already_owned'
  | 'save_failed'

export interface ClaimResponse {
  ok: boolean
  reason?: ClaimErrorReason
  /** Title of the claimed promo on success — for toast copy. */
  title?: string
  /** Human-readable error message when ok=false. */
  message?: string
}

const ERROR_MESSAGES: Record<ClaimErrorReason, string> = {
  unauthorized: 'Please sign in first to claim a promo.',
  forbidden: 'Only customer accounts can claim promos.',
  empty: 'Enter a promo code to claim.',
  not_found: "We don't recognise that code. Check for typos and try again.",
  expired: 'That code has expired or is no longer active.',
  already_owned: 'This code is already in your wallet.',
  save_failed: "Couldn't add the promo. Please try again in a moment.",
}

function err(reason: ClaimErrorReason): ClaimResponse {
  return { ok: false, reason, message: ERROR_MESSAGES[reason] }
}

export async function claimPromoCode(code: string): Promise<ClaimResponse> {
  const me = await getCurrentUser()
  if (!me) return err('unauthorized')
  if (me.role !== 'customer') return err('forbidden')

  const normalised = (code ?? '').trim().toUpperCase()
  if (!normalised) return err('empty')

  const supabase = await createClient()
  const promo = await getPublicPromoByCode(supabase, normalised)
  if (!promo) return err('not_found')

  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
    return err('expired')
  }

  const already = await hasGrant(supabase, me.authId, promo.id)
  if (already) return err('already_owned')

  // Cast — the hand-maintained Database type predates Supabase v2's
  // __InternalSupabase metadata, so insert payload inference resolves to
  // `never`. RLS still enforces the customer_id = auth.uid() constraint.
  const { error } = await supabase.from('customer_promos').insert({
    customer_id: me.authId,
    promo_id: promo.id,
    source: 'manual-claim',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
  if (error) {
    console.error('[claimPromoCode] insert failed:', error.message)
    return err('save_failed')
  }

  revalidatePath('/account/promos')
  return { ok: true, title: promo.title }
}
