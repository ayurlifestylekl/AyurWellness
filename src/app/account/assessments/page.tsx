import { Compass, Flame, Droplet, Sparkles, Moon, Brain, Leaf } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getLatestResult } from '@/lib/quizzes/queries'
import { prakritiQuiz, TOTAL_QUESTIONS } from '@/data/quizzes/prakriti'
import QuizHubCard from '@/components/assessments/QuizHubCard'

export const metadata = {
  title: 'Assessments',
}

const lockedQuizzes = [
  {
    title: 'Vikriti',
    sanskrit: 'Vikṛti',
    description:
      "What's out of balance right now — separate from your underlying constitution.",
    questionCount: 18,
    estimatedMinutes: 4,
    icon: Flame,
  },
  {
    title: 'Agni',
    sanskrit: 'Agni',
    description: 'Your digestive fire — strong, variable, sharp, or sluggish.',
    questionCount: 12,
    estimatedMinutes: 3,
    icon: Sparkles,
  },
  {
    title: 'Skin & Beauty',
    sanskrit: 'Twak',
    description: 'A dedicated assessment for skin type, sensitivity, and care.',
    questionCount: 10,
    estimatedMinutes: 3,
    icon: Droplet,
  },
  {
    title: 'Hair',
    sanskrit: 'Kesha',
    description: 'Scalp dosha, density, and the right oil for your hair journey.',
    questionCount: 10,
    estimatedMinutes: 3,
    icon: Leaf,
  },
  {
    title: 'Sleep',
    sanskrit: 'Nidra',
    description: 'How you rest — and what your nights are telling you.',
    questionCount: 10,
    estimatedMinutes: 3,
    icon: Moon,
  },
  {
    title: 'Mind & Stress',
    sanskrit: 'Manas',
    description: 'Sattva, Rajas, Tamas — the three mental qualities and your balance.',
    questionCount: 15,
    estimatedMinutes: 4,
    icon: Brain,
  },
]

export default async function AssessmentsHubPage() {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'there'

  const supabase = await createClient()
  const latest = customerId
    ? await getLatestResult(supabase, customerId, 'prakriti')
    : null

  const status: 'active' | 'completed' = latest ? 'completed' : 'active'
  const resultLabel =
    latest && prakritiQuiz.archetypes[latest.result.archetypeKey]
      ? prakritiQuiz.archetypes[latest.result.archetypeKey].name
      : undefined

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white px-6 py-8 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#EDF4E7] to-transparent"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            <Compass className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
            Assessments
          </span>
          <h1
            className="mt-3 font-heading text-[32px] font-bold leading-tight text-[#006B3C] sm:text-[44px]"
            style={{ letterSpacing: '-0.025em' }}
          >
            Hello, {firstName}.<br className="hidden sm:block" />
            <span
              className="italic font-normal text-[#006B3C]/70"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Know your nature.
            </span>
          </h1>
          <p
            className="mt-4 max-w-xl font-body text-[14px] text-[#12372D]/65 sm:text-[15px]"
            style={{ lineHeight: 1.65 }}
          >
            Ayurveda begins with knowing yourself — your constitution, your tendencies, your
            current state of balance. These short assessments are written and reviewed by
            our Vaidya and used to personalise your care.
          </p>
        </div>
      </header>

      {/* ── PRAKRITI — FLAGSHIP ───────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            Begin here
          </h2>
          {latest && (
            <p className="font-body text-[11px] italic text-[#12372D]/50">
              Last taken{' '}
              {new Intl.DateTimeFormat('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(latest.completedAt))}
            </p>
          )}
        </div>
        <QuizHubCard
          title={prakritiQuiz.title}
          sanskrit={prakritiQuiz.sanskrit}
          description={prakritiQuiz.tagline}
          questionCount={TOTAL_QUESTIONS}
          estimatedMinutes={prakritiQuiz.estimatedMinutes}
          icon={Compass}
          href="/account/assessments/prakriti"
          status={status}
          resultLabel={resultLabel}
          emphasised
        />
      </section>

      {/* ── DEEPER DIVES — LOCKED ─────────────────────────────────── */}
      <section>
        <div className="mb-3">
          <h2 className="font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            Deeper dives
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-[#12372D]/55">
            Coming soon. Each unlocks targeted recommendations once our Vaidya reviews
            your Prakriti.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lockedQuizzes.map((quiz) => (
            <QuizHubCard
              key={quiz.title}
              title={quiz.title}
              sanskrit={quiz.sanskrit}
              description={quiz.description}
              questionCount={quiz.questionCount}
              estimatedMinutes={quiz.estimatedMinutes}
              icon={quiz.icon}
              href="#"
              status="locked"
              caption="Coming soon"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
