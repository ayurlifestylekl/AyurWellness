import 'server-only'
import type { ServiceDb } from '@/lib/staff/guard'
import type { ServiceOption } from '@/lib/staff/services'
import type { ProductOption } from './queries'
import { ITEM_PREFIX } from './rules'

/**
 * Billing items staff manage themselves (20261125_counter_catalog.sql): extra
 * services, products and packages, plus website therapies / shop products
 * hidden from checkout. Before that file is run everything reads as empty and
 * checkout shows just the website's therapies and products.
 */

export type CounterItemKind = 'service' | 'product' | 'package'

export interface CounterItem {
  id: string
  kind: CounterItemKind
  name: string
  priceRm: number
  durationMins: number | null
  sessions: number | null
  validDays: number | null
  /** Set instead of validDays when the package lasts a number of months. */
  validMonths: number | null
  hidden: boolean
}

export interface CounterCatalog {
  ready: boolean
  items: CounterItem[]
  /** "treatment:<id>" / "product:<id>" hidden from checkout. */
  hidden: Set<string>
}


export async function getCounterCatalog(db: ServiceDb): Promise<CounterCatalog> {
  const cols = 'id, kind, name, price_rm, duration_mins, sessions, valid_days, is_hidden'
  const [first, hidden] = await Promise.all([
    db.from('counter_items').select(`${cols}, valid_months`).order('name'),
    db.from('counter_hidden').select('kind, ref_id'),
  ])
  let items = first
  // Before 20261130_centre_requests.sql there is no valid_months column.
  if (items.error && /valid_months/.test(items.error.message)) {
    items = (await db.from('counter_items').select(cols).order('name')) as unknown as typeof items
  }
  if (items.error || hidden.error) return { ready: false, items: [], hidden: new Set() }
  return {
    ready: true,
    items: (items.data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind as CounterItemKind,
      name: r.name,
      priceRm: Number(r.price_rm),
      durationMins: r.duration_mins ?? null,
      sessions: r.sessions ?? null,
      validDays: r.valid_days ?? null,
      validMonths: (r as { valid_months?: number | null }).valid_months ?? null,
      hidden: !!r.is_hidden,
    })),
    hidden: new Set((hidden.data ?? []).map((h) => `${h.kind}:${h.ref_id}`)),
  }
}

/** Website therapies not hidden from checkout, then the centre's own services. */
export function checkoutServices(website: ServiceOption[], c: CounterCatalog): ServiceOption[] {
  const extra = c.items
    .filter((i) => i.kind === 'service' && !i.hidden)
    .map<ServiceOption>((i) => ({
      id: ITEM_PREFIX + i.id,
      title: i.name,
      durationMins: i.durationMins ?? 0,
      price: i.priceRm,
      priceLabel: null,
      categoryId: 'counter-extra',
      categoryTitle: 'Other services',
      categoryOrder: 9999,
      bookingType: null,
    }))
  return [...website.filter((s) => !c.hidden.has(`treatment:${s.id}`)), ...extra]
}

/** Shop products not hidden from checkout, then the centre's own products (no stock count). */
export function checkoutProducts(shop: ProductOption[], c: CounterCatalog): ProductOption[] {
  const extra = c.items
    .filter((i) => i.kind === 'product' && !i.hidden)
    .map<ProductOption>((i) => ({ id: ITEM_PREFIX + i.id, name: i.name, priceRm: i.priceRm, stock: 0, allowBackorder: true, category: 'Other products', untracked: true }))
  return [...shop.filter((p) => !c.hidden.has(`product:${p.id}`)), ...extra]
}

/** Names of everything the centre sells as a product (shop and own items), for the doctor's prescription box. */
export async function medicineSuggestions(db: ServiceDb): Promise<string[]> {
  const [shop, c] = await Promise.all([db.from('products').select('name').eq('status', 'active'), getCounterCatalog(db)])
  const names = [...(shop.data ?? []).map((p) => p.name as string), ...c.items.filter((i) => i.kind === 'product' && !i.hidden).map((i) => i.name)]
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
}

/** Add-ons the counter adds in one tap on the bill: VIP Private Room and Hair Wash (when listed and not hidden). */
export function quickAdds(c: CounterCatalog): CounterItem[] {
  const order = ['VIP Private Room', 'Hair Wash (add-on)']
  return order.flatMap((name) => c.items.filter((i) => i.kind === 'service' && !i.hidden && i.name === name))
}

export function packagesForSale(c: CounterCatalog): CounterItem[] {
  return c.items.filter((i) => i.kind === 'package' && !i.hidden)
}
