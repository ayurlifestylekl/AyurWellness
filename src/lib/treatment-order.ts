/**
 * Treatment ordering helpers.
 *
 * Client request (Treatment Page amendments): therapies inside each chapter
 * must be listed by DURATION, shortest → longest. Sanity stores `duration`
 * as a free-text string (e.g. "1 HOUR 30 MIN", "45 MIN", "2 HOURS"), so we
 * can't order it numerically in GROQ — we parse to minutes and sort here.
 */

/** Parse a free-text duration into total minutes. Unparseable/empty sorts last. */
export function parseDurationMinutes(
  duration: string | null | undefined,
): number {
  if (!duration) return Number.POSITIVE_INFINITY
  const hourMatch = duration.match(/(\d+)\s*h/i) // "1 HOUR", "2 HRS"
  const minMatch = duration.match(/(\d+)\s*m/i) // "30 MIN", "45 M"
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0
  const mins = minMatch ? parseInt(minMatch[1], 10) : 0
  const total = hours * 60 + mins
  return total > 0 ? total : Number.POSITIVE_INFINITY
}

/**
 * Return a new array sorted shortest → longest by duration.
 * Stable: items with equal/unknown duration keep their incoming order.
 */
export function sortByDuration<T extends { duration: string | null }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration),
  )
}
