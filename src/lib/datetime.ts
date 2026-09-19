/**
 * Malaysia-timezone date helpers. Vercel's servers run in UTC, so any
 * `toLocaleString` without an explicit timeZone renders UTC — showing e.g.
 * 4:42 AM for a 12:42 PM Malaysia booking. Always format through these.
 */
export const MY_TZ = 'Asia/Kuala_Lumpur'

/** Format an instant in Malaysia time. Returns "—" for null/invalid. */
export function fmtMY(
  value: string | number | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  if (value == null) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-MY', { timeZone: MY_TZ, ...opts })
}

/** Malaysia time-of-day ("HH:MM", 24-hour) for an instant. */
export function mytTimeOfDay(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: MY_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d)
}

/** Malaysia calendar-day key ("YYYY-MM-DD") for grouping appointments by day. */
export function mytDayKey(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Start (inclusive) and end (exclusive) UTC ISO bounds for "today" in Malaysia. */
export function mytTodayRange(now: Date = new Date()): { startISO: string; endISO: string } {
  const dayKey = mytDayKey(now) // YYYY-MM-DD in MYT
  const start = new Date(`${dayKey}T00:00:00+08:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}
