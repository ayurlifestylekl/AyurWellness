import { getTipOfDay } from '@/lib/dashboard/wellness-tips'

/**
 * Footer editorial pull-quote — repeats the day's wellness tip in a
 * different visual register (Playfair italic, centered, generous space).
 * Closes the dashboard with a calm, branded note.
 */
export default function VaidyaNote() {
  const tip = getTipOfDay()

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-gradient-to-br from-[#EDF4E7] via-white to-[#EDF4E7]/50 px-6 py-10 text-center sm:px-12 sm:py-14">
      {/* Decorative top rule */}
      <div className="mx-auto mb-6 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#B58A3B]/40" />
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B58A3B]">
          A note from the practice
        </span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#B58A3B]/40" />
      </div>

      <blockquote
        className="mx-auto max-w-2xl font-display italic text-[#006B3C] sm:text-[22px]"
        style={{ fontSize: 18, lineHeight: 1.5, letterSpacing: '-0.005em' }}
      >
        &ldquo;{tip.quote}&rdquo;
      </blockquote>

      {tip.attribution && (
        <p className="mt-4 font-heading text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#12372D]/45">
          — {tip.attribution}
        </p>
      )}
    </section>
  )
}
