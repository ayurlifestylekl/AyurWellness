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
              className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
            >
              Try again
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-[#B58A3B]/35 bg-[#B58A3B]/10 px-4 py-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A3B]" />
          <p className="font-body text-[13px] leading-relaxed text-white/80">
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
            className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthInput
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
            className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 font-body text-[12.5px] text-red-200"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  )
}
