import Link from 'next/link'
import { sanityClient } from '@/sanity/client'
import { isSanityConfigured } from '@/sanity/env'
import { TREATMENTS_QUERY } from '@/sanity/queries'
import WalkInForm from './WalkInForm'

export const metadata = { title: 'Walk-in Appointment · Admin' }
export const dynamic = 'force-dynamic'

const FALLBACK_TREATMENTS = [
  'Initial Consultation',
  'Follow-up Consultation',
  'Online Consultation',
  'Shirodhara',
  'Abhyanga',
  'Panchakarma Consultation',
  'Nasya',
  'Kati Vasti',
]

async function loadTreatmentNames(): Promise<string[]> {
  if (!isSanityConfigured) return FALLBACK_TREATMENTS
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await sanityClient.fetch(TREATMENTS_QUERY)) as any[]
    const titles = (rows ?? [])
      .map((r) => r?.title)
      .filter((t): t is string => typeof t === 'string' && t.length > 0)
    return titles.length > 0 ? titles : FALLBACK_TREATMENTS
  } catch (err) {
    console.error('[admin/appointments/new] sanity fetch failed:', err)
    return FALLBACK_TREATMENTS
  }
}

export default async function NewWalkInPage() {
  const treatmentOptions = await loadTreatmentNames()
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/admin/appointments"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to appointments
      </Link>
      <header>
        <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
          Walk-in appointment
        </h1>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          For appointments booked in person, by phone, or recorded by staff after the fact.
          Customer record is created automatically.
        </p>
      </header>
      <WalkInForm treatmentOptions={treatmentOptions} />
    </div>
  )
}
