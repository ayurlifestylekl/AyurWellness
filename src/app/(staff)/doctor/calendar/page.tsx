import { requireStaff } from '@/lib/staff/guard'
import { getDaySchedule } from '@/lib/staff/appointments'
import { therapistsForGender } from '@/lib/staff/therapists'
import { mytDayKey } from '@/lib/datetime'
import ScheduleGrid from '@/components/staff/ScheduleGrid'
import AutoRefresh from '@/components/staff/AutoRefresh'

export const dynamic = 'force-dynamic'

export default async function DoctorCalendarPage({ searchParams }: { searchParams: { date?: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : mytDayKey(new Date())
  const [day, therapists] = await Promise.all([getDaySchedule(db, date), therapistsForGender(null)])

  return (
    <div>
      <AutoRefresh />
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Calendar</h1>
      <p className="mb-4 font-body text-[13px] text-dark/55">The day by therapist. Tap an appointment to open the patient.</p>
      <ScheduleGrid
        basePath="/doctor/calendar"
        detailBase="/doctor"
        date={date}
        therapists={therapists}
        appts={day.appts}
        unassigned={day.unassigned}
        blocks={day.blocks}
      />
    </div>
  )
}
