/**
 * Booking add-ons: extras a customer can add to a treatment, each with its own
 * price and extra time. The server re-prices from this list, so a price sent
 * from the browser is never trusted.
 *
 * Treatments are named by their catalogue key, "<category_id>__<slug>".
 */

export interface ExtraDef {
  code: string
  label: string
  description: string
  priceRm: number
  /** Minutes the add-on adds to the booking. */
  mins: number
  /** Catalogue keys of the treatments it can be added to, or 'all'. */
  treatments: string[] | 'all'
  /**
   * 'room' add-ons are a choice of room: the booking page shows Standard
   * Treatment Room (included, the default) against this one.
   */
  kind?: 'room'
}

/** As stored on the booking (appointments.extras). */
export interface ChosenExtra {
  code: string
  label: string
  priceRm: number
  mins: number
  /** VIP Private Room only: which VIP room the therapy uses. */
  room?: VipRoomKind
}

/**
 * The centre's VIP rooms. Each therapy uses one kind, and only this many VIP
 * bookings of a kind can overlap. The database checks the same numbers when
 * a booking is saved (20261129_vip_rooms.sql: keep the two in step).
 */
export type VipRoomKind = 'hair' | 'facial'
export const VIP_ROOMS: Record<VipRoomKind, { label: string; count: number; photo: string }> = {
  hair: { label: 'VIP hair & scalp room', count: 2, photo: '/treatments/awc/vip-hair-room.jpg' },
  facial: { label: 'VIP facial room', count: 1, photo: '/treatments/awc/vip-facial-room.jpg' },
}

/** Which VIP room a therapy uses: face care and the foot massage on the bed, head and hair therapies in the chair. */
export function vipRoomFor(key: string | null | undefined): VipRoomKind {
  if (!key) return 'facial'
  if (key.startsWith('cat-face-care__') || key === 'cat-massage__paadha-abhyangam') return 'facial'
  return 'hair'
}

export const EXTRAS: ExtraDef[] = [
  {
    code: 'hair_wash',
    label: 'Hair Wash',
    description: 'Have your hair washed after the treatment, so you leave fresh and oil-free.',
    priceRm: 40,
    mins: 20,
    treatments: ['cat-hair-care__hair-scalp-oil-massage', 'cat-massage__siro-abhyangam', 'cat-massage__head-neck-shoulder-massage'],
  },
  {
    code: 'vip_room',
    label: 'VIP Private Room',
    description: 'Enjoy your Ayurvedic therapy in the comfort and privacy of your own private room.',
    priceRm: 20,
    mins: 0,
    treatments: 'all',
    kind: 'room',
  },
]

export function treatmentKey(categoryId: string | null | undefined, slug: string | null | undefined): string {
  return `${categoryId ?? ''}__${slug ?? ''}`
}

/** Add-ons offered with this treatment. */
export function extrasFor(key: string | null | undefined): ExtraDef[] {
  return key ? EXTRAS.filter((e) => e.treatments === 'all' || e.treatments.includes(key)) : []
}

/**
 * The add-ons actually allowed for this treatment out of the codes requested,
 * each once, with the server's own prices. Unknown or ineligible codes are dropped.
 */
export function resolveExtras(key: string | null | undefined, codes: unknown): ChosenExtra[] {
  if (!Array.isArray(codes)) return []
  const allowed = extrasFor(key)
  const seen = new Set<string>()
  const out: ChosenExtra[] = []
  for (const c of codes) {
    const def = allowed.find((e) => e.code === c)
    if (!def || seen.has(def.code)) continue
    seen.add(def.code)
    out.push({ code: def.code, label: def.label, priceRm: def.priceRm, mins: def.mins, ...(def.kind === 'room' ? { room: vipRoomFor(key) } : {}) })
  }
  return out
}

export function extrasTotals(chosen: ChosenExtra[]): { priceRm: number; mins: number } {
  return chosen.reduce((t, e) => ({ priceRm: t.priceRm + e.priceRm, mins: t.mins + e.mins }), { priceRm: 0, mins: 0 })
}

/** "Siro Abhyangam (Head Massage) + Hair Wash" — the name staff and the customer see. */
export function nameWithExtras(title: string, chosen: ChosenExtra[]): string {
  return chosen.length ? `${title} + ${chosen.map((e) => e.label).join(' + ')}` : title
}

/** Read appointments.extras safely. */
export function readExtras(raw: unknown): ChosenExtra[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((e) =>
    e && typeof e === 'object' && typeof (e as ChosenExtra).code === 'string'
      ? [{
          code: (e as ChosenExtra).code,
          label: String((e as ChosenExtra).label ?? (e as ChosenExtra).code),
          priceRm: Number((e as ChosenExtra).priceRm ?? 0),
          mins: Number((e as ChosenExtra).mins ?? 0),
          ...((e as ChosenExtra).room ? { room: (e as ChosenExtra).room } : {}),
        }]
      : [],
  )
}

/** Shown when every VIP room of the needed kind is taken at the chosen time. */
export const VIP_FULL_ERROR = 'The VIP room is fully booked at that time. Please choose another time, or the standard treatment room.'
