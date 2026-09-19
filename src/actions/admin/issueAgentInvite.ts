'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result =
  | { ok: true; token: string; inviteUrl: string; referralCode: string }
  | { ok: false; error: string }

export async function issueAgentInvite(input: {
  fullName: string
  email: string
  commissionRate: number
  canAffiliate: boolean
  canWholesale: boolean
}): Promise<Result> {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') return { ok: false, error: 'Not authorised.' }

  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  if (!fullName) return { ok: false, error: 'Name required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Valid email required.' }
  }
  if (input.commissionRate < 0 || input.commissionRate > 100) {
    return { ok: false, error: 'Commission must be 0–100.' }
  }
  if (!input.canAffiliate && !input.canWholesale) {
    return { ok: false, error: 'Pick at least one: affiliate or wholesale.' }
  }

  // Legacy enum still NOT NULL — derive a value for backfill compatibility.
  // If they can do both, we record 'affiliate' (commission still credits via that path).
  const legacyCommissionType: 'affiliate' | 'reseller' =
    input.canAffiliate ? 'affiliate' : 'reseller'

  const token = randomBytes(24).toString('hex')
  const referralCode = `KA-${randomBytes(3).toString('hex').toUpperCase()}`
  const expiresAt = new Date(Date.now() + 14 * 86400 * 1000).toISOString()

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('agent_invites') as any).insert({
    token,
    email,
    full_name: fullName,
    referral_code: referralCode,
    commission_rate: input.commissionRate,
    commission_type: legacyCommissionType,
    can_affiliate: input.canAffiliate,
    can_wholesale: input.canWholesale,
    expires_at: expiresAt,
    created_by_admin_id: me.authId,
  })
  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { ok: false, error: 'Email or referral code already used. Try again.' }
    }
    console.error('[issueAgentInvite] failed:', msg)
    return { ok: false, error: 'Could not create invite.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/auth/register?invite=${token}`
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/partners')
  return { ok: true, token, inviteUrl, referralCode }
}
