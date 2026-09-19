import { requireStaff } from '@/lib/staff/guard'
import { getAllTherapists, getAllVaidyas } from '@/lib/staff/therapists'
import RosterManager from '@/components/staff/RosterManager'

export const dynamic = 'force-dynamic'

export default async function RosterPage() {
  await requireStaff(['admin', 'front_desk'])
  const [therapists, vaidyas] = await Promise.all([getAllTherapists(), getAllVaidyas()])

  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Staff Roster</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Manage therapists and Vaidyas. Deactivating staff removes them from new bookings but preserves appointment history.
      </p>
      <RosterManager therapists={therapists} vaidyas={vaidyas} />
    </div>
  )
}
