import { parseDurationMins } from '@/lib/booking/duration'

/**
 * A bookable/billable service as staff pick it: name, duration and price,
 * grouped by category (the schedule's "Select service" panel and the cart).
 */
export interface ServiceOption {
  id: string
  title: string
  durationMins: number
  price: number | null
  priceLabel: string | null
  categoryId: string
  categoryTitle: string
  categoryOrder: number
  bookingType: string | null
  /** Catalogue key "<category_id>__<slug>", used to find add-ons such as Hair Wash. */
  key?: string
}

export interface ServiceCategory {
  id: string
  title: string
  services: ServiceOption[]
}

interface TreatmentLike {
  _id: string
  title: string
  duration?: string | null
  price?: number | null
  priceLabel?: string | null
  categoryId?: string | null
  categoryTitle?: string | null
  categoryOrder?: number | null
  bookingType?: string | null
  catalogueKey?: string
}

export function toServiceOptions(treatments: TreatmentLike[]): ServiceOption[] {
  return treatments.map((t) => ({
    id: t._id,
    title: t.title,
    durationMins: parseDurationMins(t.duration ?? null),
    price: t.price ?? null,
    priceLabel: t.priceLabel ?? null,
    categoryId: t.categoryId ?? 'other',
    categoryTitle: t.categoryTitle || 'Other',
    categoryOrder: t.categoryOrder ?? 999,
    bookingType: t.bookingType ?? null,
    key: t.catalogueKey,
  }))
}

/** "30m", "1h", "1h 30m" — the compact style staff know from Tunai Pro. */
export function durationText(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}

export function priceText(s: Pick<ServiceOption, 'price' | 'priceLabel'>): string | null {
  if (s.price != null) return `RM${s.price.toFixed(2)}`
  return s.priceLabel || null
}

/** Categories in the site's own order, each with its services in catalog order. */
export function groupByCategory(services: ServiceOption[]): ServiceCategory[] {
  const byId = new Map<string, ServiceCategory & { order: number }>()
  for (const s of services) {
    const c = byId.get(s.categoryId) ?? { id: s.categoryId, title: s.categoryTitle, order: s.categoryOrder, services: [] }
    c.services.push(s)
    byId.set(s.categoryId, c)
  }
  return Array.from(byId.values())
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map(({ id, title, services }) => ({ id, title, services }))
}

/** Case- and accent-insensitive match on the service or its category. */
export function matchServices(services: ServiceOption[], query: string): ServiceOption[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const q = norm(query.trim())
  if (!q) return services
  return services.filter((s) => norm(s.title).includes(q) || norm(s.categoryTitle).includes(q))
}

/**
 * Staff can book every therapy from the schedule, but the booking actions only
 * take a catalog id for therapies customers can book online (not enquiry-only,
 * and — for groups — not the short 30/45-minute ones). Others are saved by
 * name and duration, which the actions already accept.
 */
export function bookableById(s: ServiceOption, forGroup: boolean): boolean {
  if (s.bookingType === 'enquiry') return false
  if (forGroup && (s.durationMins === 30 || s.durationMins === 45)) return false
  return true
}
