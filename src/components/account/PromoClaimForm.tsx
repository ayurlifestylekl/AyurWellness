'use client'

import { useState, useTransition } from 'react'
import { Ticket, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { claimPromoCode } from '@/actions/promos/claimPromoCode'

export default function PromoClaimForm() {
  const [code, setCode] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      toast.error('Enter a promo code to claim.')
      return
    }
    startTransition(async () => {
      const res = await claimPromoCode(trimmed)
      if (res.ok) {
        toast.success(`Added: ${res.title}`, {
          description: 'It now lives in your wallet.',
        })
        setCode('')
      } else {
        toast.error(res.message ?? 'Could not claim that code.')
      }
    })
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <Ticket className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          Got a code?
        </h2>
        <span className="ml-auto inline-flex items-center gap-1 font-body text-[11px] italic text-[#12372D]/55">
          <Sparkles className="h-3 w-3 text-[#B58A3B]" strokeWidth={2} />
          From Instagram, a flyer, or Vaidya
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-stretch gap-2 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
      >
        <label htmlFor="promo-code" className="sr-only">
          Promo code
        </label>
        <input
          id="promo-code"
          name="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. MONSOON25"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          disabled={isPending}
          className="flex-1 rounded-full border border-[#006B3C]/15 bg-white px-5 py-2.5 font-mono text-[14px] font-semibold uppercase tracking-[0.08em] text-[#006B3C] placeholder:font-body placeholder:text-[12.5px] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Claiming…
            </>
          ) : (
            <>
              Claim
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </section>
  )
}
