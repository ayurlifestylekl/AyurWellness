'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { changePassword } from '@/actions/profile/changePassword'

function strengthScore(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent']
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] }
}

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [isPending, startTransition] = useTransition()

  const strength = strengthScore(next)
  const mismatch = confirm.length > 0 && confirm !== next

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current) {
      toast.error('Enter your current password.')
      return
    }
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (next !== confirm) {
      toast.error("Passwords don't match.")
      return
    }

    startTransition(async () => {
      const res = await changePassword(current, next)
      if (res.ok) {
        setCurrent('')
        setNext('')
        setConfirm('')
        toast.success('Password changed.', {
          description: 'Use your new password on next sign-in.',
        })
      } else {
        toast.error(res.error ?? "Couldn't change your password.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Current password */}
      <div>
        <label
          htmlFor="pw-current"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Current password
        </label>
        <div className="relative mt-2">
          <input
            id="pw-current"
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            disabled={isPending}
            className="w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 pr-11 font-body text-[13.5px] text-[#006B3C] focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            tabIndex={-1}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#006B3C]/55 transition-colors hover:bg-[#006B3C]/[0.06]"
            aria-label={showCurrent ? 'Hide password' : 'Show password'}
          >
            {showCurrent ? (
              <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label
          htmlFor="pw-new"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          New password
        </label>
        <div className="relative mt-2">
          <input
            id="pw-new"
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            disabled={isPending}
            placeholder="At least 8 characters with a letter and a number"
            className="w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 pr-11 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowNext((v) => !v)}
            tabIndex={-1}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#006B3C]/55 transition-colors hover:bg-[#006B3C]/[0.06]"
            aria-label={showNext ? 'Hide password' : 'Show password'}
          >
            {showNext ? (
              <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </div>
        {/* Strength meter */}
        {next.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex h-1 gap-1 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    i < strength.score
                      ? strength.score >= 3
                        ? 'bg-[#006B3C]'
                        : strength.score === 2
                          ? 'bg-[#B58A3B]'
                          : 'bg-red-400'
                      : 'bg-[#006B3C]/[0.08]'
                  }`}
                />
              ))}
            </div>
            <p className="font-body text-[10.5px] italic text-[#12372D]/55">
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div>
        <label
          htmlFor="pw-confirm"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Confirm new password
        </label>
        <input
          id="pw-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          disabled={isPending}
          className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] focus:outline-none focus:ring-2 disabled:opacity-50 ${
            mismatch
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-[#006B3C]/15 focus:border-[#B58A3B] focus:ring-[#B58A3B]/30'
          }`}
        />
        {mismatch && (
          <p className="mt-1 font-body text-[11px] italic text-red-700/75">
            Passwords don&apos;t match yet.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={
            isPending ||
            !current ||
            next.length < 8 ||
            next !== confirm
          }
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Change password'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  )
}
