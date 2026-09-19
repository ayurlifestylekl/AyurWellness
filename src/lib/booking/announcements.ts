/**
 * Customer announcements — the data behind the public site banner.
 *   'closure' → the centre is closed on given dates (also blocks bookings via a
 *               linked schedule_block); shown until the end date passes.
 *   'message' → a free-text notice; shown until its optional end date passes.
 */
export interface Announcement {
  id: string
  kind: 'closure' | 'message'
  message: string
  /** 'YYYY-MM-DD' (Malaysia). Required for closures. */
  startDate: string | null
  endDate: string | null
  /** The centre-closure block a closure created (so removal reopens bookings). */
  blockId: string | null
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAnnouncementRow(r: any): Announcement {
  return {
    id: r.id,
    kind: r.kind === 'closure' ? 'closure' : 'message',
    message: r.message ?? '',
    startDate: r.start_date ?? null,
    endDate: r.end_date ?? null,
    blockId: r.block_id ?? null,
    createdAt: r.created_at ?? '',
  }
}

/** Today's date in Malaysia time as 'YYYY-MM-DD'. */
export function mytTodayYMD(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Should this announcement still appear on the banner today? */
export function isLive(a: Announcement, todayYMD: string): boolean {
  if (a.kind === 'closure') {
    // Closures need a date and hide once the last closed day has passed.
    const last = a.endDate ?? a.startDate
    return !!last && last >= todayYMD
  }
  // Messages show until an optional end date passes.
  return !a.endDate || a.endDate >= todayYMD
}

/**
 * Pick the single announcement to show: the nearest active/upcoming closure
 * takes priority, otherwise the most recent message. Null when nothing is live.
 */
export function pickActive(list: Announcement[], todayYMD: string): Announcement | null {
  const live = list.filter((a) => isLive(a, todayYMD))
  const closures = live
    .filter((a) => a.kind === 'closure')
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
  if (closures.length) return closures[0]
  const messages = live
    .filter((a) => a.kind === 'message')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return messages[0] ?? null
}
