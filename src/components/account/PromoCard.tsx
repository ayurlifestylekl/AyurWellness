'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  expiryLabel,
  formatAppliesTo,
  formatValue,
  type WalletItem,
} from '@/lib/promos/format'

interface PromoCardProps {
  item: WalletItem
  variant?: 'featured' | 'compact'
}

export default function PromoCard({ item, variant = 'compact' }: PromoCardProps) {
  const { promo } = item
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const expiry = expiryLabel(promo)
  const value = formatValue(promo)
  const applies = formatAppliesTo(promo)
  const isFeatured = variant === 'featured'
  const expiresSoon = expiry?.startsWith('Expires in') && /\b[1-7] day/.test(expiry)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(promo.code)
      setCopied(true)
      toast.success(`Copied ${promo.code}`, {
        description: 'Paste at checkout when our store opens.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — copy the code manually.")
    }
  }

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-white transition-all ${
        isFeatured
          ? 'border-[#B58A3B]/35'
          : 'border-[#006B3C]/8 hover:-translate-y-0.5 hover:border-[#B58A3B]/35'
      }`}
      style={{
        boxShadow: isFeatured
          ? '0 1px 0 0 rgba(0,107,60,0.04), 0 18px 36px -22px rgba(181, 138, 59,0.5)'
          : '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {isFeatured && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]" />
      )}

      <div className={isFeatured ? 'px-5 py-6 sm:px-8 sm:py-7' : 'px-5 py-5 sm:px-6'}>
        {/* Top — applies-to + expiry chip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#006B3C]/[0.06] px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65">
            {applies}
          </span>
          {expiry && (
            <span
              className={`font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                expiresSoon ? 'text-[#B58A3B]' : 'text-[#006B3C]/45'
              }`}
            >
              {expiry}
            </span>
          )}
        </div>

        {/* Value + Title */}
        <div className={isFeatured ? 'mt-4' : 'mt-3'}>
          <p
            className={`font-heading font-bold text-[#006B3C] ${
              isFeatured ? 'text-[34px] sm:text-[40px]' : 'text-[24px]'
            }`}
            style={{ letterSpacing: '-0.025em', lineHeight: 1 }}
          >
            {value}
          </p>
          <h3
            className={`mt-1.5 font-heading font-semibold text-[#006B3C] ${
              isFeatured ? 'text-[15px]' : 'text-[13.5px]'
            }`}
            style={{ letterSpacing: '-0.005em' }}
          >
            {promo.title}
          </h3>
        </div>

        {/* Code + Copy */}
        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#B58A3B]/45 bg-[#EDF4E7]/55 px-4 py-3 ${
            isFeatured ? 'sm:px-5' : ''
          }`}
        >
          <div>
            <p className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
              Code
            </p>
            <p
              className={`font-mono font-bold text-[#006B3C] ${
                isFeatured ? 'text-[18px] sm:text-[20px]' : 'text-[15px]'
              }`}
              style={{ letterSpacing: '0.04em' }}
            >
              {promo.code}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#B58A3B] px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
            aria-label={`Copy promo code ${promo.code}`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" strokeWidth={2.4} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" strokeWidth={2} />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Description + How to use expander */}
        {(promo.description || promo.min_spend_rm > 0) && (
          <div className="mt-4 border-t border-[#006B3C]/6 pt-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="group inline-flex w-full items-center justify-between gap-3 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55 transition-colors hover:text-[#B58A3B]"
              aria-expanded={open}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#B58A3B]" strokeWidth={2} />
                How to use
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
                strokeWidth={2}
              />
            </button>
            {open && (
              <div className="mt-2 space-y-2">
                {promo.description && (
                  <p
                    className="font-body text-[12.5px] text-[#12372D]/70"
                    style={{ lineHeight: 1.6 }}
                  >
                    {promo.description}
                  </p>
                )}
                {promo.min_spend_rm > 0 && (
                  <p className="font-body text-[11.5px] italic text-[#12372D]/55">
                    Minimum spend RM {Number(promo.min_spend_rm).toFixed(0)}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
