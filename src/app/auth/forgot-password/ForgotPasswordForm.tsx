'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import AuthCard from '@/components/auth/AuthCard'
import AuthInput from '@/components/auth/AuthInput'
import { requestPasswordReset } from '@/actions/auth/requestPasswordReset'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await requestPasswordReset(email)
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(res.error)
      }
    })
  }

  if (submitted) {
    return (
      <AuthCard
        title="Check your inbox."
        subtitle="If an account exists for that email, we just sent a reset link. It's valid for 1 hour."
        footer={
          <>
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-semibold text-[#006B3C] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
            >
              Try again
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-[#B58A3B]/25 bg-[#FBF6EC] px-4 py-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A3B]" />
          <p className="font-body text-[13px] leading-relaxed text-[#12372D]/75">
            Open the email and click the link to set a new password. The link expires in 1 hour.
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset your password."
      subtitle="Enter the email tied to your account. We'll send you a one-click link to set a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-[#006B3C] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthInput
            tone="light"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-[12.5px] text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#12372D] px-7 font-heading text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_-18px_rgba(18,55,45,0.65)] transition-all hover:bg-[#0E2C24] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  )
}
