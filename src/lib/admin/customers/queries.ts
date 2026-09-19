import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface CustomerListItem {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  createdAt: string
  totalOrders: number
  totalSpentRm: number
  lastOrderAt: string | null
  tags: string[] | null
  blocked: boolean
  doshaPrimary: string | null
}

export interface CustomerFilters {
  search?: string
  blocked?: boolean
  tag?: string
  segment?: 'all' | 'new' | 'vip' | 'at_risk' | 'blocked'
  limit?: number
  offset?: number
}

const NEW_DAYS = 30
const AT_RISK_DAYS = 90
const VIP_LIFETIME_SPEND_RM = 500

export async function listCustomers(
  supabase: SB,
  filters: CustomerFilters = {},
): Promise<{ items: CustomerListItem[]; total: number }> {
  let q = supabase
    .from('users')
    .select(
      `id, full_name, email, phone_number, created_at, tags, blocked_at,
       orders(id, total_amount_rm, payment_status, created_at),
       quiz_results(prakriti_primary)`,
      { count: 'exact' },
    )
    .eq('role', 'customer')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone_number.ilike.%${s}%,id.eq.${s}`)
  }
  if (filters.tag) q = q.contains('tags', [filters.tag])

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 50
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/customers] listCustomers failed:', error.message)
    return { items: [], total: 0 }
  }

  const cutoffNew = Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000
  const cutoffAtRisk = Date.now() - AT_RISK_DAYS * 24 * 60 * 60 * 1000

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = ((data ?? []) as any[]).map((r): CustomerListItem => {
    const orders = Array.isArray(r.orders) ? r.orders : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paid = orders.filter((o: any) => o.payment_status === 'paid')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSpent = paid.reduce((s: number, o: any) => s + Number(o.total_amount_rm ?? 0), 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastOrderAt = paid.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? paid.map((o: any) => o.created_at).sort().slice(-1)[0]
      : null
    const quiz = Array.isArray(r.quiz_results) ? r.quiz_results[0] : r.quiz_results
    return {
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone_number,
      createdAt: r.created_at,
      totalOrders: paid.length,
      totalSpentRm: totalSpent,
      lastOrderAt,
      tags: r.tags,
      blocked: !!r.blocked_at,
      doshaPrimary: quiz?.prakriti_primary ?? null,
    }
  })

  // Apply derived segment filters in-memory (cleaner than complex SQL)
  if (filters.segment === 'new') {
    items = items.filter((c) => new Date(c.createdAt).getTime() > cutoffNew)
  } else if (filters.segment === 'vip') {
    items = items.filter((c) => c.totalSpentRm >= VIP_LIFETIME_SPEND_RM)
  } else if (filters.segment === 'at_risk') {
    items = items.filter(
      (c) =>
        c.totalOrders > 0 &&
        (!c.lastOrderAt || new Date(c.lastOrderAt).getTime() < cutoffAtRisk),
    )
  } else if (filters.segment === 'blocked') {
    items = items.filter((c) => c.blocked)
  }

  if (filters.blocked !== undefined) {
    items = items.filter((c) => c.blocked === filters.blocked)
  }

  return { items, total: filters.segment ? items.length : count ?? 0 }
}

export async function getCustomerById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('users')
    .select(
      `*,
       addresses(*),
       orders(id, total_amount_rm, payment_status, fulfillment_status, created_at),
       appointments(id, treatment_id, appointment_date_time, status),
       support_tickets(id, subject, status, last_message_at, topic),
       customer_promos(*, promo:promos(*)),
       quiz_results(*)`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/customers] getCustomerById failed:', error.message)
    return null
  }
  return data
}

export async function listBirthdaysThisMonth(supabase: SB) {
  const month = new Date().getMonth() + 1
  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, date_of_birth, phone_number')
    .eq('role', 'customer')
    .is('deleted_at', null)
    .not('date_of_birth', 'is', null)
  if (!data) return { thisWeek: [], thisMonth: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (data as any[]).filter((u) => {
    if (!u.date_of_birth) return false
    const m = new Date(u.date_of_birth).getMonth() + 1
    return m === month
  })

  const today = new Date()
  const weekEnd = new Date()
  weekEnd.setDate(today.getDate() + 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thisWeek = all.filter((u: any) => {
    const d = new Date(u.date_of_birth)
    const thisYearBirthday = new Date(today.getFullYear(), d.getMonth(), d.getDate())
    return thisYearBirthday >= today && thisYearBirthday <= weekEnd
  })

  return { thisWeek, thisMonth: all }
}

export async function listAllTags(supabase: SB): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('tags')
    .eq('role', 'customer')
    .not('tags', 'is', null)
  if (!data) return []
  const set = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of data as any[]) {
    if (Array.isArray(row.tags)) row.tags.forEach((t: string) => set.add(t))
  }
  return Array.from(set).sort()
}
