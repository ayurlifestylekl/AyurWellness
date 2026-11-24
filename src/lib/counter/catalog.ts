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
  hidden: boolean
}

export interface CounterCatalog {
  ready: boolean
  items: CounterItem[]
  /** "treatment:<id>" / "product:<id>" hidden from checkout. */
  hidden: Set<string>
}


export async function getCounterCatalog(db: ServiceDb): Promise<CounterCatalog> {
  const [items, hidden] = await Promise.all([
    db.from('counter_items').select('id, kind, name, price_rm, duration_mins, sessions, valid_days, is_hidden').order('name'),
    db.from('counter_hidden').select('kind, ref_id'),
  ])
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

export function packagesForSale(c: CounterCatalog): CounterItem[] {
  return c.items.filter((i) => i.kind === 'package' && !i.hidden)
}
