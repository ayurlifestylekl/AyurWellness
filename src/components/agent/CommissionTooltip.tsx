import { Info } from 'lucide-react'

/**
 * Hover/focus tooltip explaining how commission works.
 * Pure CSS — no client JS.
 */
export default function CommissionTooltip({ rate }: { rate: number }) {
  return (
    <span className="group relative inline-flex items-center gap-1 align-middle">
      <span className="font-semibold">{rate}% commission</span>
      <Info
        className="h-3 w-3 cursor-help text-white/55 transition-colors group-hover:text-[#B58A3B]"
        strokeWidth={2}
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[#12372D]/15 bg-[#12372D] p-3 text-left font-body text-[11.5px] leading-relaxed text-white/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        You earn <strong>{rate}%</strong> on every paid order with your referral
        code. Marketplace submissions credit commission once admin approves them.
        Refunds reverse the commission automatically.
      </span>
    </span>
  )
}
