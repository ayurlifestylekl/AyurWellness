/** Parse a free-text duration label ("1 Hour 30 min") into minutes. */
export function parseDurationMins(label: string | null | undefined, fallback = 60): number {
  if (!label) return fallback
  const s = label.toLowerCase()
  const h = s.match(/(\d+)\s*(?:hour|hr)/)
  const m = s.match(/(\d+)\s*min/)
  const total = (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0)
  return total > 0 ? total : fallback
}
