'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function requireAgentSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'sales_agent') throw new Error('Not authorised.')
  return me
}

const PersonalSchema = z.object({
  fullName: z.string().min(1).max(120),
  phoneNumber: z.string().max(40).optional().or(z.literal('')),
})

const PayoutSchema = z.object({
  method: z.enum(['bank_transfer', 'tng_ewallet']),
  bankName: z.string().max(80).optional().or(z.literal('')),
  accountName: z.string().max(120).optional().or(z.literal('')),
  accountNo: z.string().max(40).optional().or(z.literal('')),
  tngPhone: z.string().max(40).optional().or(z.literal('')),
})

const ShippingSchema = z.object({
  address: z.string().min(5).max(400),
  postcode: z.string().max(20),
  state: z.string().max(60),
})

export async function updateAgentPersonal(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireAgentSession()
    const parsed = PersonalSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({
        full_name: parsed.data.fullName,
        phone_number: parsed.data.phoneNumber || null,
      })
      .eq('id', me.profile.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/agent/profile')
    revalidatePath('/agent/dashboard')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function updateAgentPayout(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireAgentSession()
    const parsed = PayoutSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const { method, bankName, accountName, accountNo, tngPhone } = parsed.data

    // Method-specific required fields
    if (method === 'bank_transfer') {
      if (!bankName || !accountName || !accountNo) {
        return { ok: false, error: 'Bank name, account name and account number are required.' }
      }
    } else if (method === 'tng_ewallet') {
      if (!tngPhone) {
        return { ok: false, error: 'TNG eWallet phone number is required.' }
      }
    }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        payout_method:        method,
        payout_bank_name:     method === 'bank_transfer' ? bankName : null,
        payout_account_name:  method === 'bank_transfer' ? accountName : null,
        payout_account_no:    method === 'bank_transfer' ? accountNo : null,
        payout_tng_phone:     method === 'tng_ewallet' ? tngPhone : null,
      })
      .eq('user_id', me.profile.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/agent/profile')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function updateAgentShipping(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireAgentSession()
    const parsed = ShippingSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        shipping_address: parsed.data.address,
        shipping_postcode: parsed.data.postcode,
        shipping_state: parsed.data.state,
      })
      .eq('user_id', me.profile.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/agent/profile')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
