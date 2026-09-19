import Link from 'next/link'
import { Gift, Cake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listCustomers,
  listAllTags,
  type CustomerFilters,
} from '@/lib/admin/customers/queries'
import { DEMO_ADMIN_EMAIL, MOCK_CUSTOMERS } from '@/lib/admin/customers/mocks'
import CustomersFilters from './CustomersFilters'
import CustomersTable from './CustomersTable'

export const metadata = { title: 'Customers · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { q?: string; segment?: string; tag?: string }
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const filters: CustomerFilters = {
    search: searchParams.q,
    segment: (searchParams.segment as CustomerFilters['segment']) ?? 'all',
    tag: searchParams.tag,
    limit: 100,
  }
  const [real, tagsRaw] = await Promise.all([
    listCustomers(supabase, filters),
    listAllTags(supabase),
  ])

  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? MOCK_CUSTOMERS : real.items
  const total = showMocks ? items.length : real.total
  const tags =
    showMocks && tagsRaw.length === 0
      ? Array.from(
          new Set(items.flatMap((c) => c.tags ?? []).filter((t): t is string => !!t)),
        )
      : tagsRaw

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            CRM
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Customers
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} customer{total === 1 ? '' : 's'} · push vouchers, manage tags, view history
            {showMocks ? ' · demo data (no real customers yet)' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/customers/birthdays"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            <Cake className="h-3.5 w-3.5" /> Birthdays
          </Link>
          <Link
            href="/admin/promos"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#B58A3B] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#B58A3B]"
          >
            <Gift className="h-3.5 w-3.5" /> Vouchers
          </Link>
        </div>
      </header>

      <CustomersFilters tags={tags} />
      <CustomersTable items={items} />
    </div>
  )
}
