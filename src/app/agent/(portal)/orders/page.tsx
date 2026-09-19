import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfileByUserId } from '@/lib/agent/dashboard/queries'
import {
  listReferredOrders,
  CHANNEL_LABEL,
  type CommissionStatus,
} from '@/lib/agent/orders/queries'
import ReferredFilters from './ReferredFilters'

export const metadata = { title: 'Referred Sales' }
export const dynamic = 'force-dynamic'

const COMMISSION_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reversed: 'bg-red-50 text-red-700 border-red-200',
}

const CHANNEL_CLASS: Record<string, string> = {
  web: 'bg-slate-50 text-slate-700 border-slate-200',
  shopee: 'bg-orange-50 text-orange-700 border-orange-200',
  tiktok_shop: 'bg-pink-50 text-pink-700 border-pink-200',
  lazada: 'bg-blue-50 text-blue-700 border-blue-200',
  instagram: 'bg-purple-50 text-purple-700 border-purple-200',
  whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  other: 'bg-slate-100 text-slate-700 border-slate-300',
  staff: 'bg-amber-50 text-amber-700 border-amber-200',
}

interface PageProps {
  searchParams: { status?: string; channel?: string; range?: string }
}

function rangeStart(range: string | undefined): Date | undefined {
  const now = new Date()
  if (range === 'this_month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (range === 'last_month') return new Date(now.getFullYear(), now.getMonth() - 1, 1)
  if (range === 'last_90') {
    const d = new Date(now)
    d.setDate(d.getDate() - 90)
    return d
  }
  return undefined
}

function rangeEnd(range: string | undefined): Date | undefined {
  const now = new Date()
  if (range === 'last_month') return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  return undefined
}

export default async function AgentReferredSalesPage({ searchParams }: PageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const profile = await getAgentProfileByUserId(supabase, me.profile.id)
  if (!profile) redirect('/agent/dashboard')

  const status = (searchParams.status as CommissionStatus | 'all') ?? 'all'
  const channel = searchParams.channel || undefined
  const range = searchParams.range ?? 'this_month'

  const orders = await listReferredOrders(supabase, profile.id, {
    status,
    channel,
    from: rangeStart(range),
    to: rangeEnd(range),
    limit: 200,
  })

  const summaryTotal = orders.reduce((s, o) => s + o.totalAmountRm, 0)
  const summaryCommission = orders.reduce((s, o) => s + o.commissionRm, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Affiliate channel
        </span>
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D]">
          Referred sales
        </h1>
        <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
          Every order attributed to your code. Commission updates as admin marks
          orders paid and pays you out.
        </p>
      </header>

      <ReferredFilters
        activeStatus={status}
        activeChannel={channel ?? ''}
        activeRange={range}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary label="Orders" value={String(orders.length)} />
        <Summary label="Gross sales" value={`RM ${summaryTotal.toFixed(2)}`} />
        <Summary
          label="Your commission"
          value={`RM ${summaryCommission.toFixed(2)}`}
          accent="green"
        />
      </section>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#12372D]/15 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
            <ShoppingBag className="h-5 w-5 text-[#149447]" strokeWidth={1.8} />
          </span>
          <p className="font-heading text-[14px] font-semibold text-[#12372D]">
            No referred sales in this view
          </p>
          <p className="max-w-sm font-body text-[12.5px] text-[#12372D]/65">
            Share your link or submit a marketplace order to start earning. Try a
            wider date range to see older sales.
          </p>
          <Link
            href="/agent/dashboard"
            className="mt-1 text-[12px] font-semibold text-[#B58A3B] hover:underline"
          >
            Copy your share link →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#12372D]/8 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12372D]/6">
              {orders.map((o) => {
                const isReversed = o.commissionStatus === 'reversed'
                return (
                  <tr
                    key={o.orderId}
                    className={`hover:bg-[#EDF4E7]/30 ${
                      isReversed ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-[11.5px] text-[#12372D]/70">
                      {new Date(o.createdAt).toLocaleDateString('en-MY')}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#12372D]">
                      {o.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${CHANNEL_CLASS[o.channel] ?? CHANNEL_CLASS.other}`}
                      >
                        {CHANNEL_LABEL[o.channel] ?? o.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-semibold text-[#12372D]">
                        {o.itemsCount}
                      </div>
                      {o.firstItemName ? (
                        <div className="text-[11px] text-[#12372D]/55">
                          {o.firstItemName}
                          {o.itemsCount > 1 ? ` + ${o.itemsCount - 1} more` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      RM {o.totalAmountRm.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-heading font-bold text-emerald-700">
                        {o.commissionRm > 0
                          ? `+RM ${o.commissionRm.toFixed(2)}`
                          : '—'}
                      </div>
                      {o.commissionStatus ? (
                        <span
                          className={`mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${COMMISSION_CLASS[o.commissionStatus] ?? ''}`}
                        >
                          {o.commissionStatus}
                        </span>
                      ) : o.paymentStatus !== 'paid' ? (
                        <span className="mt-1 block text-[10.5px] italic text-[#12372D]/55">
                          accrues when paid
                        </span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Summary({
  label,
  value,
  accent = 'neutral',
}: {
  label: string
  value: string
  accent?: 'neutral' | 'green'
}) {
  return (
    <div className="rounded-2xl border border-[#12372D]/10 bg-white p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/55">
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-[20px] font-bold ${
          accent === 'green' ? 'text-emerald-700' : 'text-[#12372D]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
