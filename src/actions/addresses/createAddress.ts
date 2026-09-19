'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createNotification } from '@/lib/notifications/create'

type Result = { ok: true; id: string } | { ok: false; error: string }

const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/
const POSTCODE_RE = /^\d{5}$/

export interface AddressInput {
  label: string
  recipient: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postcode: string
  country?: string
  is_default?: boolean
}

export async function createAddress(input: AddressInput): Promise<Result> {
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
  if (label.length > 100 || recipient.length > 100 || city.length > 100 || state.length > 100) {
    return { ok: false, error: 'One of your fields is too long.' }
  }
  if (line1.length > 200) return { ok: false, error: 'Street address is too long.' }
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
  const { data, error } = await (supabase.from('addresses') as any)
    .insert({
      customer_id: me.authId,
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
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[createAddress] failed:', error?.message)
    return { ok: false, error: 'Could not save address.' }
  }

  await createNotification({
    userId: me.authId,
    kind: 'address_saved',
    title: 'Address saved',
    body: `${label} is now in your address book.`,
    href: '/account/addresses',
  })

  revalidatePath('/account/addresses')
  revalidatePath('/account/profile')
  return { ok: true, id: (data as { id: string }).id }
}
