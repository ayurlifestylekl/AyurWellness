import { createClient } from '@/lib/supabase/server'
import { getFinanceSummary, defaultMonthRange } from '@/lib/admin/finance/queries'
import RangePicker from './RangePicker'

export const metadata = { title: 'Finance · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { start?: string; end?: string }
}

const EXTERNAL_CHANNEL_LABEL: Record<string, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  shopee: 'Shopee',
  tiktok_shop: 'TikTok Shop',
  lazada: 'Lazada',
  instagram: 'Instagram',
  other: 'Other',
  staff: 'Staff entry',
}

export default async function AdminFinancePage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const def = defaultMonthRange()
  const start = searchParams.start ? new Date(searchParams.start) : def.start
  const end = searchParams.end ? new Date(searchParams.end) : def.end
  const f = await getFinanceSummary(supabase, start, end)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Numbers
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Finance
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            Read-only summary for{' '}
            <strong>
              {new Date(f.rangeStart).toLocaleDateString('en-MY')} —{' '}
              {new Date(f.rangeEnd).toLocaleDateString('en-MY')}
            </strong>
            . Based on paid orders, refunds, and commission ledger.
          </p>
        </div>
        <RangePicker start={start.toISOString()} end={end.toISOString()} />
      </header>

      {/* Headline KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Gross revenue" value={f.grossRevenueRm} accent="green" />
        <Kpi label="Refunds" value={f.refundsRm} accent="red" />
        <Kpi label="Net revenue" value={f.netRevenueRm} accent="green" big />
        <Kpi
          label="Avg order"
          value={f.avgOrderRm}
          accent="neutral"
          footnote={`${f.ordersCount} paid order${f.ordersCount === 1 ? '' : 's'}`}
        />
      </section>

      {/* Commissions */}
      <section className="rounded-2xl border border-[#006B3C]/10 bg-white p-5">
        <h2 className="font-heading text-[15px] font-semibold text-[#006B3C]">
          Affiliate commissions
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi label="Accrued" value={f.commissionsAccruedRm} accent="neutral" />
          <Kpi label="Paid out" value={f.commissionsPaidRm} accent="green" />
          <Kpi label="Outstanding" value={f.commissionsOutstandingRm} accent="amber" />
        </div>
      </section>

      {/* Two-column: top products + channels */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#006B3C]/10 bg-white p-5">
          <h2 className="font-heading text-[15px] font-semibold text-[#006B3C]">
            Top products by revenue
          </h2>
          {f.topProducts.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-[#12372D]/55">
              No paid orders in this range.
            </p>
          ) : (
            <table className="mt-3 w-full text-left text-[13px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                <tr>
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#006B3C]/6">
                {f.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-right">{p.qty}</td>
                    <td className="py-2 text-right font-semibold">
                      RM {p.revenueRm.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="rounded-2xl border border-[#006B3C]/10 bg-white p-5">
          <h2 className="font-heading text-[15px] font-semibold text-[#006B3C]">
            Revenue by channel
          </h2>
          {f.channelBreakdown.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-[#12372D]/55">
              No paid orders in this range.
            </p>
          ) : (
            <table className="mt-3 w-full text-left text-[13px]">
              <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                <tr>
                  <th className="py-2">Channel</th>
                  <th className="py-2 text-right">Orders</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#006B3C]/6">
                {f.channelBreakdown.map((c) => (
                  <tr key={c.channel}>
                    <td className="py-2">
                      {EXTERNAL_CHANNEL_LABEL[c.channel] ?? c.channel}
                    </td>
                    <td className="py-2 text-right">{c.ordersCount}</td>
                    <td className="py-2 text-right font-semibold">
                      RM {c.revenueRm.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </div>
  )
}

function Kpi({
  label,
  value,
  accent,
  big,
  footnote,
}: {
  label: string
  value: number
  accent: 'green' | 'red' | 'amber' | 'neutral'
  big?: boolean
  footnote?: string
}) {
  const color =
    accent === 'green'
      ? 'text-emerald-700'
      : accent === 'red'
        ? 'text-red-700'
        : accent === 'amber'
          ? 'text-amber-700'
          : 'text-[#006B3C]'
  return (
    <div className="rounded-2xl border border-[#006B3C]/10 bg-white p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#006B3C]/55">
        {label}
      </p>
      <p
        className={`mt-1 font-heading font-bold ${big ? 'text-[26px]' : 'text-[18px]'} ${color}`}
      >
        RM {value.toFixed(2)}
      </p>
      {footnote ? (
        <p className="mt-1 text-[11px] text-[#12372D]/55">{footnote}</p>
      ) : null}
    </div>
  )
}
