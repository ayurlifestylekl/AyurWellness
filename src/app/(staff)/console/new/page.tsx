import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { therapistsForGender } from '@/lib/staff/therapists'
import StaffNewBooking from '@/components/staff/StaffNewBooking'

export const dynamic = 'force-dynamic'

export default async function NewBookingPage() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const [treatments, therapists] = await Promise.all([getTreatmentsFlat(db), therapistsForGender(null)])
  const options = treatments.map((t) => ({ id: t._id, title: t.title, bookingType: t.bookingType }))

  return (
    <div>
      <Link href="/console" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Console
      </Link>
      <h1 className="mt-3 font-heading text-[22px] font-extrabold text-primary">New booking</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">Log a walk-in or phone booking on the customer&apos;s behalf. You&apos;ll approve &amp; assign on the next screen.</p>
      <StaffNewBooking treatments={options} therapists={therapists} />
    </div>
  )
}
