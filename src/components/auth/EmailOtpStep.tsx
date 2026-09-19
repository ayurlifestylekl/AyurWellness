'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import AuthInput from './AuthInput'
import { resendEmailOtp } from '@/actions/auth/resendEmailOtp'

const RESEND_SECONDS = 30

interface EmailOtpStepProps {
  /** The address the code was sent to. Shown in the body copy. */
  email: string
  /** Caption above the code field: e.g. "Verify your account" / "Confirm sign-in". */
  title?: string
  /** Submit handler — verifies the code with the right server action. */
  onVerify: (code: string) => Promise<{ ok: true; redirectTo?: string } | { ok: false; error: string }>
  /** Callback after a successful verification (usually router.push). */
  onSuccess: (redirectTo?: string) => void
  /** Optional back action to return to the previous step. */
  onBack?: () => void
  /** Primary button label override. */
  submitLabel?: string
}

/**
 * Shared OTP code-entry view. Used by:
 *   • Sign-in step 2 after password validation
 *   • Sign-up step 2 after the form submits
 *
 * 6-digit input, auto-submits on the 6th digit, 30s resend cooldown.
 */
export default function EmailOtpStep({
  email,
  title,
  onVerify,
  onSuccess,
  onBack,
  submitLabel,
}: EmailOtpStepProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const [resentNotice, setResentNotice] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    codeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const submit = (raw?: string) => {
    setError(null)
    const value = (raw ?? code).trim()
    if (!/^\d{6}$/.test(value)) {
      setError('Please enter the 6-digit code from your email.')
      return
    }
    startTransition(async () => {
      const res = await onVerify(value)
      if (res.ok) {
        onSuccess(res.redirectTo)
      } else {
        setError(res.error)
      }
    })
  }

  const resend = () => {
    if (resendIn > 0 || isPending) return
    setError(null)
    setResentNotice(false)
    setCode('')
    startTransition(async () => {
      const res = await resendEmailOtp(email)
      if (res.ok) {
        setResentNotice(true)
        setResendIn(RESEND_SECONDS)
        setTimeout(() => setResentNotice(false), 4000)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-[#B58A3B]/30 bg-[#B58A3B]/[0.08] px-4 py-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A3B]" />
        <p className="font-body text-[12.5px] leading-relaxed text-white/80">
          {title ? <span className="block font-semibold text-white">{title}</span> : null}
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-white">{email}</span>. It expires in 25 minutes.
        </p>
      </div>

      <AuthInput
        ref={codeRef}
        label="6-digit code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="[0-9]*"
        required
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6)
          setCode(v)
          if (v.length === 6) {
            // Auto-submit on the 6th digit
            setTimeout(() => submit(v), 80)
          }
        }}
        placeholder="123456"
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 font-body text-[12px] text-red-200"
        >
          {error}
        </p>
      )}

      {resentNotice && (
        <p
          role="status"
          className="rounded-xl border border-green-400/40 bg-green-400/10 px-3 py-2 font-body text-[12px] text-green-200"
        >
          A new code was sent. Check your inbox.
        </p>
      )}

      <button
        type="button"
        onClick={() => submit()}
        disabled={isPending || code.length !== 6}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-[13px] font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? 'Verifying…' : submitLabel ?? 'Verify & sign in'}
      </button>

      <div className="pt-1 text-center font-body text-[12px] text-white/55">
        Didn&apos;t get it?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={resendIn > 0 || isPending}
          className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#FFF9F2] hover:underline disabled:cursor-not-allowed disabled:text-white/35 disabled:no-underline disabled:hover:text-white/35"
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
