import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface PromoListItem {
  id: string
  code: string
  title: string
  description: string | null
  kind: 'percentage' | 'fixed' | 'free-shipping'
  valueAmount: number | null
  minSpendRm: number
  appliesTo: 'all' | 'products' | 'treatments' | 'consultation'
  startsAt: string
  expiresAt: string | null
  isPublic: boolean
  isActive: boolean
  usageCount: number
  createdAt: string
}

export async function listPromos(supabase: SB): Promise<PromoListItem[]> {
  const { data, error } = await supabase
    .from('promos')
    .select(`*, customer_promos(id)`)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[admin/promos] listPromos failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    kind: r.kind,
    valueAmount: r.value_amount != null ? Number(r.value_amount) : null,
    minSpendRm: Number(r.min_spend_rm),
    appliesTo: r.applies_to,
    startsAt: r.starts_at,
    expiresAt: r.expires_at,
    isPublic: r.is_public,
    isActive: r.is_active,
    usageCount: Array.isArray(r.customer_promos) ? r.customer_promos.length : 0,
    createdAt: r.created_at,
  }))
}

export async function getPromoById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/promos] getPromoById failed:', error.message)
    return null
  }
  return data
}
