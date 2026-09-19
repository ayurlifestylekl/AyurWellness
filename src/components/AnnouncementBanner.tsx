import { getActiveAnnouncement } from '@/lib/storefront/booking'
import { fmtMY } from '@/lib/datetime'
import AnnouncementNotice from './AnnouncementNotice'

/**
 * Server component: renders the current customer announcement (a closure or a
 * message) as a dismissible strip, or nothing when none is live.
 */
export default async function AnnouncementBanner() {
  const a = await getActiveAnnouncement()
  if (!a) return null

  let text: string
  if (a.kind === 'closure' && a.startDate) {
    const fmt = (ymd: string) => fmtMY(`${ymd}T12:00:00+08:00`, { weekday: 'short', day: 'numeric', month: 'long' })
    const end = a.endDate && a.endDate !== a.startDate ? a.endDate : null
    const when = end ? `${fmt(a.startDate)} – ${fmt(end)}` : fmt(a.startDate)
    text = `Our centre will be closed on ${when}${a.message ? ` for ${a.message}` : ''}. Online bookings resume the next open day.`
  } else {
    text = a.message
  }

  return <AnnouncementNotice id={a.id} text={text} variant={a.kind} />
}
