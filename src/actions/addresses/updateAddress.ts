'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import type { AddressInput } from './createAddress'

type Result = { ok: true } | { ok: false; error: string }

const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/
const POSTCODE_RE = /^\d{5}$/

export async function updateAddress(id: string, input: AddressInput): Promise<Result> {
  if (!id) return { ok: false, error: 'Missing address ID.' }
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const label = input.label.trim()
  const recipient = input.recipient.trim()
  const phone = input.phone.trim()
  const line1 = input.line1.trim()
  const city = input.city.trim()
  const state = input.state.trim()
  const postcode = input.postcode.trim()

  if (!label || !recipient || !phone || !line1 || !city || !state || !postcode) {
    return { ok: false, error: 'Please fill all required fields.' }
  }
  if (!PHONE_RE.test(phone)) return { ok: false, error: 'Phone number looks invalid.' }
  if (!POSTCODE_RE.test(postcode)) return { ok: false, error: 'Postcode should be 5 digits.' }

  const supabase = await createClient()

  if (input.is_default) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('addresses') as any)
      .update({ is_default: false })
      .eq('customer_id', me.authId)
      .eq('is_default', true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('addresses') as any)
    .update({
      label,
      recipient,
      phone,
      line1,
      line2: input.line2?.trim() || null,
      city,
      state,
      postcode,
      country: input.country?.trim() || 'Malaysia',
      is_default: !!input.is_default,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('customer_id', me.authId)

  if (error) {
    console.error('[updateAddress] failed:', error.message)
    return { ok: false, error: 'Could not update address.' }
  }
  revalidatePath('/account/addresses')
  return { ok: true }
}
