import { Gift, Sparkles } from 'lucide-react'
import type { WalletItem } from '@/lib/promos/format'
import { walletTotal, expiryLabel } from '@/lib/promos/format'

interface WalletBalanceHeroProps {
  active: WalletItem[]
}

export default function WalletBalanceHero({ active }: WalletBalanceHeroProps) {
  const { totalRm, fixedCount, percentageCount, freeShippingCount } =
    walletTotal(active)

  // Count vouchers expiring within the next 7 days
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000
  const expiringSoon = active.filter((item) => {
    if (!item.promo.expires_at) return false
    const t = new Date(item.promo.expires_at).getTime()
    return t > Date.now() && t < sevenDaysFromNow
  }).length

  const voucherCount = active.length

  // Build extra summary chips for non-fixed offers
  const extras: string[] = []
  if (percentageCount > 0) {
    extras.push(
      `${percentageCount} percentage offer${percentageCount === 1 ? '' : 's'}`
    )
  }
  if (freeShippingCount > 0) {
    extras.push(
      `${freeShippingCount} free shipping voucher${freeShippingCount === 1 ? '' : 's'}`
    )
  }

  // Featured = soonest-expiring (already sorted by bucketWallet)
  const featured = active[0]

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#B58A3B]/30 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 18px 36px -22px rgba(181, 138, 59,0.4)',
      }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]" />

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — balance */}
        <div className="flex flex-col gap-3 px-5 py-7 sm:px-9 sm:py-9">
          <span className="inline-flex w-fit items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            <Gift className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
            Wallet balance
          </span>

          {fixedCount > 0 ? (
            <div className="flex items-baseline gap-2">
              <span
                className="font-heading text-[44px] font-bold leading-none text-[#006B3C] sm:text-[56px]"
                style={{ letterSpacing: '-0.03em' }}
              >
                RM {totalRm.toFixed(0)}
              </span>
              <span
                className="font-heading text-[14px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
              >
                available
              </span>
            </div>
          ) : voucherCount > 0 ? (
            <p
              className="font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[32px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {voucherCount} {voucherCount === 1 ? 'voucher' : 'vouchers'} ready
            </p>
          ) : (
            <p
              className="font-heading text-[24px] font-semibold text-[#006B3C]/70"
              style={{ letterSpacing: '-0.01em' }}
            >
              No vouchers yet
            </p>
          )}

          <p
            className="font-body text-[13px] text-[#12372D]/65"
            style={{ lineHeight: 1.65 }}
          >
            {voucherCount === 0 ? (
              <>
                Welcome offers, seasonal codes, and rewards land here. Check back as
                we run promos — or claim a code below.
              </>
            ) : (
              <>
                {voucherCount} active {voucherCount === 1 ? 'voucher' : 'vouchers'}
                {extras.length > 0 && (
                  <>
                    {' · '}plus {extras.join(' and ')}
                  </>
                )}
                {expiringSoon > 0 && (
                  <>
                    {' · '}
                    <span className="text-[#B58A3B]">
                      {expiringSoon} expiring this week
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Right — featured voucher preview */}
        {featured && (
          <div className="relative flex flex-col gap-3 border-t border-[#006B3C]/8 bg-[#EDF4E7]/55 px-5 py-7 sm:px-9 sm:py-9 lg:border-l lg:border-t-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B58A3B]">
              <Sparkles className="h-3 w-3 text-[#B58A3B]" strokeWidth={2} />
              Featured
            </span>
            <p
              className="font-heading text-[15px] font-bold text-[#006B3C]"
              style={{ letterSpacing: '-0.01em' }}
            >
              {featured.promo.title}
            </p>
            <p
              className="font-mono text-[13px] font-semibold text-[#006B3C]/85"
              style={{ letterSpacing: '0.05em' }}
            >
              {featured.promo.code}
            </p>
            <p className="font-body text-[11.5px] italic text-[#12372D]/55">
              {expiryLabel(featured.promo) ?? 'No expiry'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
