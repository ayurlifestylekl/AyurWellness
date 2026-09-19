import Link from 'next/link'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import InitialsAvatar from './InitialsAvatar'
import { prakritiQuiz } from '@/data/quizzes/prakriti'
import type { ArchetypeKey } from '@/types/quiz'

interface ProfileHeroProps {
  fullName: string | null
  email: string | null
  userId: string
  memberSinceLabel: string
  archetypeKey: ArchetypeKey | null
}

export default function ProfileHero({
  fullName,
  email,
  userId,
  memberSinceLabel,
  archetypeKey,
}: ProfileHeroProps) {
  const displayName = fullName?.trim() || 'Member'
  const archetype = archetypeKey ? prakritiQuiz.archetypes[archetypeKey] : null

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 18px 36px -22px rgba(0,107,60,0.22)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#EDF4E7]/55 to-transparent"
      />

      <div className="relative flex flex-wrap items-center gap-5 px-5 py-7 sm:px-9 sm:py-9">
        <InitialsAvatar name={displayName} seed={userId} size="xl" />

        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            <Sparkles className="h-3 w-3 text-[#B58A3B]" strokeWidth={2} />
            Member since {memberSinceLabel}
          </span>
          <h1
            className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
            style={{ letterSpacing: '-0.025em' }}
          >
            {displayName}
          </h1>
          {email && (
            <p className="mt-1 font-body text-[12.5px] text-[#12372D]/55">
              {email}
            </p>
          )}

          {archetype ? (
            <Link
              href="/account/assessments/prakriti/results"
              className="group mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#B58A3B]/30 bg-[#EDF4E7]/55 px-3 py-1 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:border-[#B58A3B]/55 hover:bg-[#EDF4E7]"
            >
              <span
                className="italic text-[#B58A3B]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {archetype.sanskrit}
              </span>
              <span className="text-[#006B3C]/50">·</span>
              <span>{archetype.title}</span>
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <Link
              href="/account/assessments/prakriti"
              className="group mt-3 inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/55 underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
            >
              Take the Prakriti assessment
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
