import type { SupabaseClient } from '@supabase/supabase-js'

export type PayoutMethod = 'bank_transfer' | 'tng_ewallet' | null

export interface AgentProfileFull {
  // sales_agents
  agentId: string
  referralCode: string
  commissionRate: number
  status: 'active' | 'suspended' | null
  canAffiliate: boolean
  canWholesale: boolean
  payoutMethod: PayoutMethod
  payoutBankName: string | null
  payoutAccountName: string | null
  payoutAccountNo: string | null
  payoutTngPhone: string | null
  shippingAddress: string | null
  shippingPostcode: string | null
  shippingState: string | null
  // users
  userId: string
  fullName: string | null
  phoneNumber: string | null
  email: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function getAgentProfileFull(
  supabase: SB,
  userId: string,
): Promise<AgentProfileFull | null> {
  const { data, error } = await supabase
    .from('sales_agents')
    .select(`
      id, referral_code, commission_rate, status,
      can_affiliate, can_wholesale,
      payout_method, payout_bank_name, payout_account_name,
      payout_account_no, payout_tng_phone,
      shipping_address, shipping_postcode, shipping_state,
      user:users!sales_agents_user_id_fkey(id, full_name, phone_number, email)
    `)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = data
  const u = Array.isArray(row.user) ? row.user[0] : row.user
  return {
    agentId: row.id,
    referralCode: row.referral_code,
    commissionRate: Number(row.commission_rate ?? 0),
    status: row.status ?? null,
    canAffiliate: Boolean(row.can_affiliate),
    canWholesale: Boolean(row.can_wholesale),
    payoutMethod: row.payout_method ?? null,
    payoutBankName: row.payout_bank_name ?? null,
    payoutAccountName: row.payout_account_name ?? null,
    payoutAccountNo: row.payout_account_no ?? null,
    payoutTngPhone: row.payout_tng_phone ?? null,
    shippingAddress: row.shipping_address ?? null,
    shippingPostcode: row.shipping_postcode ?? null,
    shippingState: row.shipping_state ?? null,
    userId: u?.id ?? userId,
    fullName: u?.full_name ?? null,
    phoneNumber: u?.phone_number ?? null,
    email: u?.email ?? null,
  }
}
