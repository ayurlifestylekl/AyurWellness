import { Sparkles } from 'lucide-react'
import { BotanicalMandala, FloatingLeaf } from '@/components/ui/Decorations'
import { getTimeGreeting, getTipOfDay } from '@/lib/dashboard/wellness-tips'

interface DashboardHeroProps {
  firstName: string
}

export default function DashboardHero({ firstName }: DashboardHeroProps) {
  const greeting = getTimeGreeting()
  const tip = getTipOfDay()

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-black/15 bg-gradient-to-br from-[#006B3C] to-[#12372D] px-6 py-5 text-white sm:px-8 sm:py-5"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(255,255,255,0.05), 0 24px 50px -24px rgba(18,55,45,0.55)',
      }}
    >
      {/* Gold hairline along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(181,138,59,0.55), transparent)' }}
      />
      {/* Decoration layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(65% 60% at 82% 6%, rgba(181,138,59,0.20), transparent 64%), radial-gradient(50% 60% at 0% 100%, rgba(241,124,165,0.12), transparent 64%)',
        }}
      />
      <BotanicalMandala
        className="pointer-events-none absolute -right-20 -top-12 hidden h-[260px] w-[260px] sm:block"
        opacity={0.07}
        stroke="#B58A3B"
      />
      <FloatingLeaf
        className="pointer-events-none absolute right-8 bottom-4 hidden h-12 w-10 rotate-[12deg] lg:block"
        color="#006B3C"
        strokeColor="#B58A3B"
        opacity={0.18}
      />

      <div className="relative z-10">
        {/* Eyebrow */}
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/30 bg-[#B58A3B]/10 px-2.5 py-0.5">
          <Sparkles className="h-2.5 w-2.5 text-[#B58A3B]" />
          <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.28em] text-[#B58A3B]">
            Member Portal
          </span>
        </div>

        {/* Greeting */}
        <h1
          className="font-heading text-[22px] font-bold leading-tight text-white sm:text-[26px] lg:text-[30px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {greeting},{' '}
          <span className="text-[#B58A3B]">{firstName}.</span>
        </h1>

        {/* Wellness tip */}
        <div className="mt-2 max-w-2xl">
          <p
            className="font-display italic text-white/75 sm:text-[14px]"
            style={{ fontSize: 13, lineHeight: 1.5 }}
          >
            &ldquo;{tip.quote}&rdquo;
          </p>
          {tip.attribution && (
            <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.18em] text-white/40">
              — {tip.attribution}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
