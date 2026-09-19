import { requireStaff } from '@/lib/staff/guard'
import { getVaidyaSchedule } from '@/lib/staff/appointments'
import { getAllVaidyas } from '@/lib/staff/therapists'
import { mytDayKey } from '@/lib/datetime'
import VaidyaScheduleGrid from '@/components/staff/VaidyaScheduleGrid'
import AutoRefresh from '@/components/staff/AutoRefresh'

export const dynamic = 'force-dynamic'

export default async function ConsoleDoctorsPage({ searchParams }: { searchParams: { date?: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : mytDayKey(new Date())
  const [day, vaidyas] = await Promise.all([getVaidyaSchedule(db, date), getAllVaidyas()])

  return (
    <div>
      <AutoRefresh />
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Vaidya Schedule</h1>
      <p className="mb-4 font-body text-[13px] text-dark/55">
        Day view by Vaidya. All consultation bookings are shown, including public bookings with no assigned therapist.
        Tap an appointment to open it, a free slot to book it, or a block to edit/remove it.
      </p>
      <VaidyaScheduleGrid
        date={date}
        vaidyas={vaidyas.filter((v) => v.active !== false)}
        appts={day.appts}
        blocks={day.blocks}
        editable
        detailBase="/console"
      />
    </div>
  )
}
