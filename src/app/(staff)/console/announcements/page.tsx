import { requireStaff } from '@/lib/staff/guard'
import AnnouncementManager from '@/components/staff/AnnouncementManager'
import { mapAnnouncementRow } from '@/lib/booking/announcements'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const { data } = await db
    .from('announcements')
    .select('id, kind, message, start_date, end_date, block_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const announcements = (data ?? []).map(mapAnnouncementRow)

  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Announcements</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Push a notice to the public website. A <b>closure</b> also blocks bookings for those dates; a <b>message</b> is
        banner-only. Remove it to take it down.
      </p>
      <AnnouncementManager announcements={announcements} />
    </div>
  )
}
