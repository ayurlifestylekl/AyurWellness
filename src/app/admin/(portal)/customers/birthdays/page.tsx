import Link from 'next/link'
import { Cake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listBirthdaysThisMonth } from '@/lib/admin/customers/queries'

export const metadata = { title: 'Birthdays · Admin' }
export const dynamic = 'force-dynamic'

export default async function BirthdaysPage() {
  const supabase = await createClient()
  const { thisWeek, thisMonth } = await listBirthdaysThisMonth(supabase)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Link
        href="/admin/customers"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to customers
      </Link>
      <header>
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-[#B58A3B]" />
          <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">Birthdays</h1>
        </div>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          Customers with a birthday this month — send them a voucher to celebrate.
        </p>
      </header>

      <BirthdaySection title="This week" customers={thisWeek} />
      <BirthdaySection title="This month" customers={thisMonth} />
    </div>
  )
}

function BirthdaySection({
  title,
  customers,
}: {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customers: any[]
}) {
  return (
    <section className="rounded-2xl border border-[#006B3C]/8 bg-white">
      <header className="flex items-center justify-between border-b border-[#006B3C]/6 px-5 py-3">
        <h2 className="font-heading text-[14px] font-semibold text-[#006B3C]">
          {title} ({customers.length})
        </h2>
      </header>
      {customers.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
          No birthdays {title.toLowerCase()}.
        </p>
      ) : (
        <ul className="divide-y divide-[#006B3C]/6">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between px-5 py-3 text-[13px]"
            >
              <div>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                >
                  {c.full_name ?? 'Unnamed'}
                </Link>
                <p className="text-[11.5px] text-[#12372D]/55">{c.email}</p>
              </div>
              <span className="text-[12px] text-[#12372D]/65">
                {c.date_of_birth
                  ? new Date(c.date_of_birth).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
