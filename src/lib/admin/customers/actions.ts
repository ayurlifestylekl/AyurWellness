'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

// ---------------------------------------------------------------------------
// Customer admin actions
// ---------------------------------------------------------------------------

export async function blockCustomer(
  customerId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason is required.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({
        blocked_at: new Date().toISOString(),
        blocked_reason: reason,
      })
      .eq('id', customerId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/customers/${customerId}`)
    revalidatePath('/admin/customers')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function unblockCustomer(customerId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ blocked_at: null, blocked_reason: null })
      .eq('id', customerId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/customers/${customerId}`)
    revalidatePath('/admin/customers')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function addCustomerInternalNote(
  customerId: string,
  note: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ internal_notes: note })
      .eq('id', customerId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/customers/${customerId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function setCustomerTags(
  customerId: string,
  tags: string[],
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
      .update({ tags: tags.length > 0 ? tags : null })
      .eq('id', customerId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/customers/${customerId}`)
    revalidatePath('/admin/customers')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function sendPasswordResetForCustomer(
  customerId: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { data: cust } = await supabase
      .from('users')
      .select('email')
      .eq('id', customerId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const email = (cust as any)?.email
    if (!email) return { ok: false, error: 'Customer has no email.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/reset-password`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Voucher Push — the marquee feature
// ---------------------------------------------------------------------------

const PushExistingSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
  promoId: z.string().uuid(),
  message: z.string().max(280).optional(),
})

const OneOffSchema = z.object({
  customerIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  kind: z.enum(['percentage', 'fixed', 'free-shipping']),
  valueAmount: z.number().nonnegative().optional(),
  minSpendRm: z.number().nonnegative().default(0),
  appliesTo: z.enum(['all', 'products', 'treatments', 'consultation']).default('all'),
  expiresInDays: z.number().int().positive().default(14),
  message: z.string().max(280).optional(),
})

function shortVoucherCode(): string {
  // 8-char random alphanumeric, easy-to-read (no 0/O/1/I)
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return `KAL${s}`
}

/**
 * Pushes an existing promo template to one or more customers.
 * Used by single-customer "Push voucher" button and bulk push from list.
 */
export async function pushExistingPromo(
  raw: unknown,
): Promise<ActionResult<{ pushed: number; failed: number }>> {
  try {
    await requireAdminSession()
    const input = PushExistingSchema.parse(raw)
    const supabase = await createClient()

    const { data: promoRaw } = await supabase
      .from('promos')
      .select('id, code, title, description, expires_at, is_active')
      .eq('id', input.promoId)
      .single()
    if (!promoRaw) return { ok: false, error: 'Promo not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promo: any = promoRaw
    if (!promo.is_active) return { ok: false, error: 'Promo is inactive.' }

    let pushed = 0
    let failed = 0
    for (const customerId of input.customerIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-await-in-loop
      const { error } = await (supabase.from('customer_promos') as any).insert({
        customer_id: customerId,
        promo_id: input.promoId,
        source: 'admin-grant',
        status: 'active',
      })
      if (error) {
        failed++
        continue
      }
      // Bell notification + email fan-out — fire-and-forget per customer
      // eslint-disable-next-line no-await-in-loop
      await createNotification({
        userId: customerId,
        kind: 'promo_granted',
        title: `You got a voucher: ${promo.title}`,
        body:
          input.message ?? `Use code ${promo.code} at checkout. ${promo.description ?? ''}`,
        href: '/account/promos',
      })
      pushed++
    }
    revalidatePath('/admin/customers')
    return { ok: true, data: { pushed, failed } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

/**
 * Creates a one-off (private) promo and immediately pushes it to the target
 * customer(s). Useful for "Welcome gift", "Birthday voucher", "Thanks for the
 * review" scenarios where admin doesn't want a public reusable code.
 */
export async function pushOneOffVoucher(
  raw: unknown,
): Promise<ActionResult<{ promoId: string; code: string; pushed: number }>> {
  try {
    await requireAdminSession()
    const input = OneOffSchema.parse(raw)
    const supabase = await createClient()

    // Generate a unique code
    let code = shortVoucherCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      // eslint-disable-next-line no-await-in-loop
      const { data: existing } = await supabase
        .from('promos')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (!existing) break
      code = shortVoucherCode()
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays)

    // Insert the private promo template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promo, error: pErr } = await (supabase.from('promos') as any)
      .insert({
        code,
        title: input.title,
        description: input.description ?? null,
        kind: input.kind,
        value_amount: input.valueAmount ?? null,
        min_spend_rm: input.minSpendRm,
        applies_to: input.appliesTo,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_public: false,
        is_active: true,
      })
      .select('id')
      .single()
    if (pErr || !promo) {
      return { ok: false, error: pErr?.message ?? 'Failed to create promo.' }
    }

    // Push to each target customer
    let pushed = 0
    for (const customerId of input.customerIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-await-in-loop
      const { error } = await (supabase.from('customer_promos') as any).insert({
        customer_id: customerId,
        promo_id: promo.id,
        source: 'admin-grant',
        status: 'active',
      })
      if (error) continue
      // eslint-disable-next-line no-await-in-loop
      await createNotification({
        userId: customerId,
        kind: 'promo_granted',
        title: input.title,
        body:
          input.message ??
          `Use code ${code} at checkout. Valid for ${input.expiresInDays} days.`,
        href: '/account/promos',
      })
      pushed++
    }

    revalidatePath('/admin/customers')
    revalidatePath('/admin/promos')
    return { ok: true, data: { promoId: promo.id, code, pushed } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

// Suppress unused-var warning for `me` if not referenced elsewhere — keeps the
// auth call required for security even if we don't read it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void (async () => {})
