import { requireStaff } from '@/lib/staff/guard'
import { therapistsForGender, getAllVaidyas } from '@/lib/staff/therapists'
import BlockManager from '@/components/staff/BlockManager'
import type { ScheduleBlock } from '@/lib/booking/blocks'

export const dynamic = 'force-dynamic'

export default async function BlocksPage() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const [{ data }, therapists, vaidyas] = await Promise.all([
    db.from('schedule_blocks')
      .select('id, therapist_code, start_at, end_at, all_day, recurrence, until_date, reason')
      .order('start_at', { ascending: false })
      .limit(200),
    therapistsForGender(null),
    getAllVaidyas(),
  ])

  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Availability &amp; leave</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Block out slots or mark staff leave. Blocked therapists are removed from booking availability and can&apos;t be assigned.
      </p>
      <BlockManager blocks={(data ?? []) as ScheduleBlock[]} therapists={therapists} vaidyas={vaidyas} />
    </div>
  )
}
