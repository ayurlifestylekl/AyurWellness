'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export interface SearchHit {
  kind: 'customer' | 'order' | 'product'
  id: string
  title: string
  subtitle: string
  href: string
}

export async function adminSearch(q: string): Promise<SearchHit[]> {
  const term = q.trim()
  if (term.length < 2) return []
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') return []
  const supabase = await createClient()
  const like = `%${term}%`

  const [customers, orders, products] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, email, phone_number')
      .or(`full_name.ilike.${like},email.ilike.${like},phone_number.ilike.${like}`)
      .eq('role', 'customer')
      .limit(5),
    supabase
      .from('orders')
      .select('id, total_amount_rm, customer:users(full_name)')
      .ilike('id', like)
      .limit(5),
    supabase
      .from('products')
      .select('id, name, sku, price_rm')
      .or(`name.ilike.${like},sku.ilike.${like}`)
      .limit(5),
  ])

  const hits: SearchHit[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((customers.data ?? []) as any[]).forEach((r) =>
    hits.push({
      kind: 'customer',
      id: r.id,
      title: r.full_name ?? r.email ?? '(no name)',
      subtitle: r.email ?? r.phone_number ?? '',
      href: `/admin/customers/${r.id}`,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((orders.data ?? []) as any[]).forEach((r) =>
    hits.push({
      kind: 'order',
      id: r.id,
      title: `Order #${(r.id as string).slice(-6).toUpperCase()}`,
      subtitle: `${r.customer?.full_name ?? 'unknown'} · RM ${Number(
        r.total_amount_rm
      ).toFixed(2)}`,
      href: `/admin/orders/${r.id}`,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((products.data ?? []) as any[]).forEach((r) =>
    hits.push({
      kind: 'product',
      id: r.id,
      title: r.name,
      subtitle: `SKU ${r.sku} · RM ${Number(r.price_rm).toFixed(2)}`,
      href: `/admin/products/${r.id}`,
    })
  )
  return hits
}
