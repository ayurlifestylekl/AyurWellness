import { mytDayKey, mytTimeOfDay } from '@/lib/datetime'

/**
 * Customer booking slots. Public bookings are only accepted at fixed start
 * times: 09:30, 11:30, 14:30, 16:30, 18:30. The centre's last therapy must
 * finish by 8:30 PM, so the latest valid start shifts with therapy length.
 * All times are Malaysia time (UTC+8).
 */
const CLOSE_END_MIN = 20 * 60 + 30 // 20:30 — a therapy must end by here
const CONSULTATION_LAST_START_MIN = 19 * 60 + 30 // 19:30 — last bookable consultation slot

/** Public start times (minutes from midnight). */
const PUBLIC_START_MINS = [
  9 * 60 + 30,  // 09:30
  11 * 60 + 30, // 11:30
  14 * 60 + 30, // 14:30
  16 * 60 + 30, // 16:30
  18 * 60 + 30, // 18:30
]

export const CONSULTATION_MINS = 30

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

/** Fixed public start times (HH:MM) bookable for a therapy of the given length. */
export function slotsForDuration(durationMins: number): string[] {
  const lastStart = CLOSE_END_MIN - durationMins
  const out: string[] = []
  for (const m of PUBLIC_START_MINS) {
    if (m <= lastStart) out.push(hhmm(m))
  }
  return out
}

/** Canonical Vaidya consultation starts (the consultation day begins at 10:30, last start 19:30). */
export function consultationSlots(): string[] {
  const out: string[] = []
  for (let m = 10 * 60 + 30; m <= CONSULTATION_LAST_START_MIN; m += 30) {
    out.push(hhmm(m))
  }
  return out
}

export function validateSubmittedSlot(input: {
  iso: string
  durationMins: number
  nowMs: number
  leadTimeHours: number
  kind: 'treatment' | 'consultation'
}): { ok: true } | { error: string } {
  const at = new Date(input.iso).getTime()
  if (!Number.isFinite(at)) return { error: 'Please choose a valid appointment time.' }
  // Global 24-hour lead time. Per-treatment booking_lead_time_hours may be stricter.
  const minLeadHours = Math.max(input.leadTimeHours, 24)
  if (at <= input.nowMs + minLeadHours * 3_600_000) return { error: 'That time is too soon — we need at least 24 hours notice.' }
  const hhmm = mytTimeOfDay(input.iso)
  const generated = input.kind === 'consultation'
    ? consultationSlots()
    : slotsForDuration(input.durationMins)
  if (!generated.includes(hhmm)) return { error: 'That time is outside the available booking schedule.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mytDayKey(input.iso))) return { error: 'Please choose a valid appointment date.' }
  return { ok: true }
}

/** Combine a YYYY-MM-DD date + HH:MM (Malaysia time) into a UTC ISO string. */
export function slotIso(dateYMD: string, time: string): string {
  return new Date(`${dateYMD}T${time}:00+08:00`).toISOString()
}

/** Earliest bookable date (at least 24 hours from now) as YYYY-MM-DD. */
export function minBookableDate(now: Date = new Date()): string {
  const minInstant = now.getTime() + 24 * 3_600_000
  // Walk forward from the minimum instant to find the first calendar day that
  // contains a public start slot. Use the shortest duration (30 min) so the
  // date is not over-restricted — stricter validation happens per slot later.
  let day = new Date(minInstant)
  for (let i = 0; i < 14; i++) {
    const dateKey = mytDayKey(day)
    for (const time of slotsForDuration(30)) {
      const iso = slotIso(dateKey, time)
      if (new Date(iso).getTime() >= minInstant) {
        return dateKey
      }
    }
    day = new Date(day.getTime() + 24 * 3_600_000)
  }
  return mytDayKey(day)
}
