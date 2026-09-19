import type { Gender } from '@/types/booking'

// Pure types + formatters, deliberately kept out of therapists.ts (which is
// 'server-only') so client components can import them without dragging the
// DB-touching module — and its service-role client — into the browser bundle.

export interface Therapist {
  code: string
  name: string
  gender: Gender
  active?: boolean
}

export interface Vaidya {
  code: string
  name: string
  /** If false, this Vaidya is selectable by staff internally but never shown in customer-facing consultation booking. */
  publicFacing?: boolean
  active?: boolean
}

/** "Asha · AS12" display label. */
export function therapistLabel(t: Pick<Therapist, 'code' | 'name'>): string {
  return `${t.name} · ${t.code}`
}

export function vaidyaLabel(v: Pick<Vaidya, 'code' | 'name'>): string {
  return `${v.name} · ${v.code}`
}
