import { TrendingUp, Activity, Gift, Flame } from 'lucide-react'
import type {
  TopSellingProduct,
  VaidyaUtilization,
  ActivePromo,
  MostBookedTreatment,
} from '@/lib/admin/queries'

interface Props {
  topSelling: TopSellingProduct[]
  utilization: VaidyaUtilization
  promos: ActivePromo[]
  topTreatment: MostBookedTreatment | null
  /** Show the shop insights (top-selling products, promos). Archived by default. */
  commerce?: boolean
}

const CARD_SHADOW =
  '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)'

export default function InsightsRow({
  topSelling,
  utilization,
  promos,
  topTreatment,
  commerce = true,
}: Props) {
  // When the shop is archived only the clinic cards remain, so they widen to
  // fill the row evenly (6 + 6 instead of 6 + 3 + 3).
  const clinicSpan = commerce ? 'lg:col-span-3' : 'lg:col-span-6'
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
      {/* Top selling — shop only */}
      {commerce && (
      <article
        className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white lg:col-span-6"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <header className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3.5">
          <TrendingUp className="h-3.5 w-3.5 text-[#B58A3B]" />
          <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">
            Top selling this week
          </h3>
        </header>
        {topSelling.length === 0 ? (
          <p className="px-5 py-8 text-center font-body text-[12.5px] italic text-[#12372D]/55">
            No sales yet this week.
          </p>
        ) : (
          <ol className="divide-y divide-[#006B3C]/6">
            {topSelling.map((p, i) => (
              <li
                key={p.productId}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-heading text-[11px] font-bold tabular-nums text-[#006B3C]/40">
                    {i + 1}
                  </span>
                  <p className="truncate font-heading text-[12.5px] font-semibold text-[#006B3C]">
                    {p.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
                    {p.unitsSold} sold
                  </p>
                  <p className="font-body text-[10.5px] text-[#12372D]/55">
                    RM {p.revenueRm.toFixed(0)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </article>
      )}

      {/* Vaidya utilization */}
      <article
        className={`overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white p-5 ${clinicSpan}`}
        style={{ boxShadow: CARD_SHADOW }}
      >
        <header className="flex items-center gap-2.5">
          <Activity className="h-3.5 w-3.5 text-[#006B3C]" />
          <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">
            Vaidya utilization
          </h3>
        </header>
        <p
          className="mt-3 font-heading text-[34px] font-bold leading-none text-[#006B3C]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {utilization.percent}%
        </p>
        <p className="mt-1 font-body text-[11.5px] text-[#12372D]/55">
          {(utilization.bookedMinutes / 60).toFixed(1)} of{' '}
          {(utilization.availableMinutes / 60).toFixed(0)} hours this week
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#006B3C]/[0.06]">
          <div
            className="h-full rounded-full bg-[#006B3C]"
            style={{ width: `${utilization.percent}%` }}
          />
        </div>
      </article>

      {/* Most-booked treatment (clinic) + active promos (shop) stacked */}
      <div className={`flex flex-col gap-3 lg:gap-4 ${clinicSpan}`}>
        <article
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white p-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <header className="flex items-center gap-2.5">
            <Flame className="h-3.5 w-3.5 text-[#B58A3B]" />
            <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">Most booked</h3>
          </header>
          {topTreatment ? (
            <>
              <p className="mt-3 truncate font-heading text-[14px] font-bold text-[#006B3C]">
                {topTreatment.name}
              </p>
              <p className="mt-1 font-body text-[11.5px] text-[#12372D]/55">
                {topTreatment.bookings} bookings this week
              </p>
            </>
          ) : (
            <p className="mt-3 font-body text-[12px] italic text-[#12372D]/55">
              No bookings yet
            </p>
          )}
        </article>
        {commerce && (
        <article
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white p-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <header className="flex items-center gap-2.5">
            <Gift className="h-3.5 w-3.5 text-[#B58A3B]" />
            <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">Active promos</h3>
          </header>
          {promos.length === 0 ? (
            <p className="mt-3 font-body text-[12px] italic text-[#12372D]/55">
              No campaigns running
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {promos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11.5px] font-semibold text-[#006B3C]">
                    {p.code}
                  </span>
                  <span className="truncate font-body text-[10.5px] text-[#12372D]/55">
                    {p.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
        )}
      </div>
    </section>
  )
}
