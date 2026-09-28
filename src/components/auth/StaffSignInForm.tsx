'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ShieldCheck, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { signInWithPassword } from '@/actions/auth/signInWithPassword'

interface StaffSignInFormProps {
  portal: string
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  ctaLabel: string
  defaultRedirect: string
  crossLink: { prompt: string; label: string; href: string }
  resetSuccess?: boolean
  nextPath?: string
}

export default function StaffSignInForm({
  portal,
  title,
  subtitle,
  emailLabel,
  emailPlaceholder,
  ctaLabel,
  defaultRedirect,
  crossLink,
  resetSuccess,
  nextPath,
}: StaffSignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signInWithPassword(email, password)
      if (res.ok) {
        router.push(res.redirectTo ?? nextPath ?? defaultRedirect)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-3xl border border-[#12372D]/[0.06] bg-white p-6 sm:p-10"
        style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 30px 60px -30px rgba(18,55,45,0.28), 0 12px 24px -16px rgba(181,138,59,0.18)' }}
      >
      <span aria-hidden className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B58A3B] to-transparent" />
      <div className="inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/30 bg-[#FBF6EC] px-3 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A6420]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B58A3B] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#B58A3B]" />
        </span>
        {portal} · Secure
      </div>

      <h1
        className="mt-5 font-heading text-[32px] font-bold leading-[1.1] text-[#12372D] sm:text-[38px]"
        style={{ letterSpacing: '-0.025em' }}
      >
        {title}
        <span className="block font-display font-normal italic text-[#B58A3B]">Please sign in.</span>
      </h1>
      <p className="mt-3 font-body text-[14px] leading-relaxed text-[#12372D]/60">{subtitle}</p>

      <div aria-hidden className="mt-7 flex items-center gap-3">
        <span className="h-px w-10 bg-[#B58A3B]" />
        <span className="h-px flex-1 bg-[#12372D]/10" />
      </div>

      {resetSuccess && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#006B3C]/20 bg-[#EDF4E7] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#006B3C]" />
          <p className="font-body text-[13px] text-[#12372D]/85">Password reset. Sign in with your new password.</p>
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
        <Field label={emailLabel} htmlFor="staff-email">
          <input
            id="staff-email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder={emailPlaceholder}
            className={inputClass}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="staff-password"
          aside={
            <Link
              href="/auth/forgot-password"
              className="font-body text-[12.5px] font-medium text-[#006B3C] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="staff-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#12372D]/40 transition-colors hover:text-[#12372D]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group relative mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#12372D] px-7 font-heading text-[12.5px] font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 hover:bg-[#0E2C24] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A3B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ boxShadow: '0 18px 36px -18px rgba(18,55,45,0.65), inset 0 1px 0 0 rgba(255,255,255,0.08)' }}
        >
          <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#E4C384]/70 to-transparent" />
          {isPending ? 'Signing in…' : ctaLabel}
          <ArrowRight className="h-4 w-4 text-[#E4C384] transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-[#F6F7F3] px-4 py-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#006B3C]" />
        <p className="font-body text-[12px] text-[#12372D]/60">
          Authorised personnel only. All sessions are logged.
        </p>
        <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-[#12372D]/25" />
      </div>
      </div>

      <p className="mt-6 text-center font-body text-[13px] text-[#12372D]/50">
        {crossLink.prompt}{' '}
        <Link
          href={crossLink.href}
          className="font-semibold text-[#006B3C] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
        >
          {crossLink.label}
        </Link>
      </p>
    </div>
  )
}

const inputClass =
  'block h-[52px] w-full rounded-xl border border-[#12372D]/12 bg-[#FAFAF7] px-4 font-body text-[15px] text-[#12372D] placeholder:text-[#12372D]/30 transition-all duration-200 hover:border-[#12372D]/25 focus:border-[#006B3C] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006B3C]/10'

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string
  htmlFor: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={htmlFor} className="font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12372D]/70">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  )
}
