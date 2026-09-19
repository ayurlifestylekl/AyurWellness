import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  listAppointments,
  countPendingRequests,
  type AppointmentFilters,
} from '@/lib/admin/appointments/queries'
import AppointmentsFilters from './AppointmentsFilters'
import AppointmentsTable from './AppointmentsTable'

export const metadata = { title: 'Appointments · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { segment?: string; q?: string }
}

export default async function AdminAppointmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters: AppointmentFilters = {
    segment:
      (searchParams.segment as AppointmentFilters['segment']) ?? 'today',
    search: searchParams.q,
    limit: 100,
  }
  const [real, requestCount] = await Promise.all([
    listAppointments(supabase, filters),
    countPendingRequests(supabase),
  ])

  const items = real.items
  const total = real.total

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Clinic
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Appointments
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} appointment{total === 1 ? '' : 's'} · {filters.segment}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/console"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B58A3B]/50 bg-[#B58A3B]/10 px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#B58A3B]/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Bookings Console
          </Link>
          <Link
            href="/admin/treatments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Treatments
          </Link>
          <Link
            href="/admin/appointments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C]"
          >
            <Plus className="h-3.5 w-3.5" />
            Walk-in
          </Link>
        </div>
      </header>

      <AppointmentsFilters requestCount={requestCount} />
      <AppointmentsTable items={items} />
    </div>
  )
}
