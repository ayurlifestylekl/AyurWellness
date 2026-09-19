'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AuthInput from './AuthInput'
import { sendPhoneOtp } from '@/actions/auth/sendPhoneOtp'
import { verifyPhoneOtp } from '@/actions/auth/verifyPhoneOtp'

type PhoneOtpFormProps = {
  /** 'signin' hides the full-name input; 'signup' shows it (required on first signup) */
  mode: 'signin' | 'signup'
}

type Step = 'phone' | 'code'

const RESEND_SECONDS = 30

export default function PhoneOtpForm({ mode }: PhoneOtpFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resendIn, setResendIn] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // Auto-focus the code field when step changes
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  const requestCode = () => {
    setError(null)
    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Please tell us your name first.')
      return
    }
    startTransition(async () => {
      const res = await sendPhoneOtp(phone)
      if (res.ok) {
        setStep('code')
        setResendIn(RESEND_SECONDS)
      } else {
        setError(res.error)
      }
    })
  }

  const submitCode = () => {
    setError(null)
    startTransition(async () => {
      const res = await verifyPhoneOtp(phone, code, mode === 'signup' ? fullName : undefined)
      if (res.ok) {
        router.push(res.redirectTo ?? '/account/dashboard')
      } else {
        setError(res.error)
      }
    })
  }

  const resend = () => {
    if (resendIn > 0) return
    setError(null)
    setCode('')
    startTransition(async () => {
      const res = await sendPhoneOtp(phone)
      if (res.ok) {
        setResendIn(RESEND_SECONDS)
      } else {
        setError(res.error)
      }
    })
  }

  const backToPhone = () => {
    setStep('phone')
    setCode('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      {step === 'phone' && (
        <>
          {mode === 'signup' && (
            <AuthInput
              label="Full name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Priya Nair"
            />
          )}
          <AuthInput
            label="Malaysian mobile"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+60 12 345 6789"
            hint="We'll text you a 6-digit code. Standard SMS rates may apply."
          />
          {error && <ErrorBox text={error} />}
          <button
            type="button"
            onClick={requestCode}
            disabled={isPending || phone.length < 5}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Sending code…' : 'Send code'}
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <button
            type="button"
            onClick={backToPhone}
            className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-[#B58A3B]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change number
          </button>
          <p className="font-body text-[12.5px] leading-relaxed text-white/65">
            Code sent to <span className="font-semibold text-white">{phone}</span>. It expires in about a minute.
          </p>
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
                // Auto-submit when the 6th digit lands
                setTimeout(() => submitCode(), 100)
              }
            }}
            placeholder="123456"
          />
          {error && <ErrorBox text={error} />}
          <button
            type="button"
            onClick={submitCode}
            disabled={isPending || code.length !== 6}
            className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#B58A3B] px-7 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Verifying…' : mode === 'signup' ? 'Create account' : 'Verify & sign in'}
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
        </>
      )}
    </div>
  )
}

function ErrorBox({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 font-body text-[12.5px] text-red-200"
    >
      {text}
    </p>
  )
}
