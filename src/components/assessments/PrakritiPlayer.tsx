'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Compass, RotateCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { prakritiQuiz, TOTAL_QUESTIONS } from '@/data/quizzes/prakriti'
import type { Dosha, QuizProgressState, QuizQuestion } from '@/types/quiz'
import { savePrakritiResult } from '@/actions/quizzes/savePrakritiResult'
import QuestionCard from './QuestionCard'
import SectionIntro from './SectionIntro'

const STORAGE_KEY = 'kal_quiz_prakriti_v1'

type Step =
  | { kind: 'intro' }
  | { kind: 'section'; sectionIdx: number }
  | {
      kind: 'question'
      sectionIdx: number
      questionIdx: number
      question: QuizQuestion
    }

function buildSteps(): Step[] {
  const steps: Step[] = [{ kind: 'intro' }]
  prakritiQuiz.sections.forEach((section, sectionIdx) => {
    steps.push({ kind: 'section', sectionIdx })
    section.questions.forEach((question, questionIdx) => {
      steps.push({ kind: 'question', sectionIdx, questionIdx, question })
    })
  })
  return steps
}

interface PrakritiPlayerProps {
  /** True when a previous result already exists — we offer "Resume" vs "Start over". */
  hasPriorResult: boolean
}

export default function PrakritiPlayer({ hasPriorResult }: PrakritiPlayerProps) {
  const router = useRouter()
  const steps = useMemo(buildSteps, [])
  const [stepIndex, setStepIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Dosha>>({})
  const [hydrated, setHydrated] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as QuizProgressState
        if (parsed && typeof parsed === 'object' && parsed.slug === 'prakriti') {
          setResponses(parsed.responses ?? {})
          const idx = steps.findIndex((s) => keyForStep(s) === parsed.cursor)
          if (idx >= 0) setStepIndex(idx)
        }
      }
    } catch {
      // Bad storage; ignore.
    }
    setHydrated(true)
  }, [steps])

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return
    const current = steps[stepIndex]
    const state: QuizProgressState = {
      slug: 'prakriti',
      responses,
      cursor: keyForStep(current),
      updatedAt: new Date().toISOString(),
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Quota or privacy mode — fail silently.
    }
  }, [responses, stepIndex, steps, hydrated])

  const currentStep = steps[stepIndex]
  const questionStepsBefore = countQuestionsBefore(steps, stepIndex)
  const totalAnswered = Object.keys(responses).length
  const progressPct = Math.min(100, (totalAnswered / TOTAL_QUESTIONS) * 100)
  const isLastStep = stepIndex === steps.length - 1

  function clearProgress() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function handleSelect(dosha: Dosha) {
    if (currentStep.kind !== 'question') return
    setResponses((prev) => ({ ...prev, [currentStep.question.id]: dosha }))
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  function handleNext() {
    if (currentStep.kind === 'question') {
      const answered = responses[currentStep.question.id]
      if (!answered) {
        toast.error('Pick the option that fits you best.')
        return
      }
    }
    if (isLastStep) {
      handleSubmit()
      return
    }
    setStepIndex((idx) => Math.min(steps.length - 1, idx + 1))
  }

  function handleStartOver() {
    setResponses({})
    setStepIndex(1) // skip intro on restart
    clearProgress()
  }

  function handleSubmit() {
    if (totalAnswered < TOTAL_QUESTIONS) {
      toast.error(`Please answer all ${TOTAL_QUESTIONS} questions before continuing.`)
      return
    }
    startTransition(async () => {
      const res = await savePrakritiResult({ responses })
      if (!res.ok) {
        toast.error("Couldn't save your result — try again in a moment.")
        return
      }
      clearProgress()
      toast.success('Result saved to your profile.')
      router.push('/account/assessments/prakriti/results')
    })
  }

  // ── RENDER ─────────────────────────────────────────────────────

  // SSR safety: render the intro statically until hydrated; avoids flicker.
  if (!hydrated) {
    return <PlayerIntroShell hasPriorResult={hasPriorResult} />
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 sm:gap-8">
      {/* Top chrome — back link to hub + progress + reset */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/account/assessments"
          className="group inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/55 transition-colors hover:text-[#B58A3B]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to assessments
        </Link>
        {totalAnswered > 0 && currentStep.kind !== 'intro' && (
          <button
            type="button"
            onClick={handleStartOver}
            className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/45 transition-colors hover:text-red-700"
          >
            <RotateCw className="h-3 w-3" />
            Start over
          </button>
        )}
      </div>

      {/* Progress bar */}
      {currentStep.kind !== 'intro' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/45">
            <span>{Math.round(progressPct)}% complete</span>
            <span>
              {Math.min(questionStepsBefore + (currentStep.kind === 'question' ? 1 : 0), TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 overflow-hidden rounded-full bg-[#12372D]/[0.08]"
          >
            <motion.div
              className="h-full bg-[#B58A3B]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        </div>
      )}

      {/* Stage */}
      <div className="rounded-3xl border border-[#12372D]/8 bg-white px-5 py-7 sm:px-9 sm:py-10"
        style={{
          boxShadow:
            '0 1px 0 0 rgba(18, 55, 45,0.04), 0 18px 36px -22px rgba(18, 55, 45,0.18)',
        }}
      >
        <AnimatePresence mode="wait">
          {currentStep.kind === 'intro' && (
            <IntroPanel
              key="intro"
              hasPriorResult={hasPriorResult}
              onBegin={() => setStepIndex(1)}
            />
          )}
          {currentStep.kind === 'section' && (
            <SectionIntro
              key={`s-${currentStep.sectionIdx}`}
              section={prakritiQuiz.sections[currentStep.sectionIdx]}
              sectionNumber={currentStep.sectionIdx + 1}
              totalSections={prakritiQuiz.sections.length}
            />
          )}
          {currentStep.kind === 'question' && (
            <QuestionCard
              key={currentStep.question.id}
              question={currentStep.question}
              selected={responses[currentStep.question.id] ?? null}
              onSelect={handleSelect}
              currentNumber={questionStepsBefore + 1}
              totalNumber={TOTAL_QUESTIONS}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      {currentStep.kind !== 'intro' && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 || isPending}
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-[#12372D]/15 bg-white px-5 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#12372D] transition-all hover:border-[#12372D]/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isPending}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#149447] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#12372D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Reading your nature…
              </>
            ) : isLastStep ? (
              <>
                See my profile
                <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              </>
            ) : (
              <>
                {currentStep.kind === 'section' ? 'Begin section' : 'Continue'}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────

function IntroPanel({
  hasPriorResult,
  onBegin,
}: {
  hasPriorResult: boolean
  onBegin: () => void
}) {
  return (
    <motion.div
      key="intro-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4E7]">
        <Compass className="h-6 w-6 text-[#B58A3B]" strokeWidth={1.6} />
      </span>
      <p
        className="mt-5 italic text-[15px] text-[#B58A3B]"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Prakṛti
      </p>
      <h1
        className="mt-1 font-heading text-[28px] font-bold leading-tight text-[#12372D] sm:text-[36px]"
        style={{ letterSpacing: '-0.025em' }}
      >
        Know your nature.
      </h1>
      <div
        aria-hidden
        className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#B58A3B] to-transparent"
      />
      <p
        className="mt-5 max-w-lg font-body text-[14.5px] text-[#12372D]/70 sm:text-[15.5px]"
        style={{ lineHeight: 1.7 }}
      >
        Twenty-four questions across body, mind, and lifestyle. Answer how you’ve been
        most of your life, not just this week. our Vaidya reviews every profile — your
        result becomes the starting point for personal care.
      </p>

      <ul
        className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/55"
      >
        <li>24 questions</li>
        <li className="text-[#B58A3B]">·</li>
        <li>~ 5 minutes</li>
        <li className="text-[#B58A3B]">·</li>
        <li>Saved to your profile</li>
      </ul>

      <button
        type="button"
        onClick={onBegin}
        className="group mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#149447] px-7 font-heading text-[12px] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#12372D] active:scale-[0.98]"
      >
        {hasPriorResult ? 'Take again' : 'Begin assessment'}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  )
}

function PlayerIntroShell({ hasPriorResult }: { hasPriorResult: boolean }) {
  // Static SSR placeholder shown until client hydration completes. Matches
  // the intro layout so there's no jank.
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="rounded-3xl border border-[#12372D]/8 bg-white px-5 py-7 sm:px-9 sm:py-10">
        <IntroPanel hasPriorResult={hasPriorResult} onBegin={() => {}} />
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────

function keyForStep(step: Step): string {
  if (step.kind === 'intro') return 'intro'
  if (step.kind === 'section') return `section:${step.sectionIdx}`
  return `q:${step.sectionIdx}.${step.questionIdx}`
}

function countQuestionsBefore(steps: Step[], idx: number): number {
  let count = 0
  for (let i = 0; i < idx; i += 1) {
    if (steps[i].kind === 'question') count += 1
  }
  return count
}
