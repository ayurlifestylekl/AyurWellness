'use client'

import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestGuestManagementOtp, verifyGuestManagementOtp } from '@/lib/booking/management-actions'

const RESEND_SECONDS = 60

export default function GuestBookingRecovery({ recovered = false }: { recovered?: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  if (recovered) {
    return (
      <div role="status" className="rounded-2xl border border-green-500/30 bg-green-50 p-6 text-green-900">
        <h2 className="font-heading text-xl font-bold">Booking access restored</h2>
        <p className="mt-2 font-body text-sm">You can now use this secure link to manage the eligible bookings connected to your email.</p>
      </div>
    )
  }

  const requestCode = (event?: FormEvent) => {
    event?.preventDefault()
    setError(null)
    setNotice(null)
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }
    startTransition(async () => {
      const result = await requestGuestManagementOtp(normalizedEmail)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setStep('code')
      setNotice(result.data.message)
      setResendIn(RESEND_SECONDS)
    })
  }

  const verifyCode = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code from your email.')
      return
    }
    startTransition(async () => {
      const result = await verifyGuestManagementOtp(email, code)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.replace(result.data.href)
    })
  }

  const resend = () => {
    if (resendIn > 0 || pending) return
    setCode('')
    requestCode()
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-white p-6 shadow-elevated sm:p-8">
      {step === 'email' ? (
        <form onSubmit={requestCode} noValidate>
          <label htmlFor="recovery-email" className="font-heading text-sm font-bold text-primary">
            Booking email
          </label>
          <p id="recovery-email-help" className="mt-1 font-body text-sm text-dark/65">
            We will send a six-digit code if this email has an eligible guest booking.
          </p>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            aria-describedby="recovery-email-help"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-4 h-12 w-full rounded-xl border border-dark/20 px-4 font-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" disabled={pending} className="mt-4 h-12 w-full rounded-xl bg-accent px-6 font-heading text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-60">
            {pending ? 'Sending…' : 'Send access code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} noValidate>
          <label htmlFor="recovery-code" className="font-heading text-sm font-bold text-primary">
            Six-digit code
          </label>
          <p id="recovery-code-help" className="mt-1 font-body text-sm text-dark/65">
            Enter the code from your email. It expires in 10 minutes.
          </p>
          <input
            id="recovery-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            aria-describedby="recovery-code-help"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-4 h-12 w-full rounded-xl border border-dark/20 px-4 text-center font-heading text-xl tracking-[0.4em] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" disabled={pending || code.length !== 6} className="mt-4 h-12 w-full rounded-xl bg-accent px-6 font-heading text-xs font-bold uppercase tracking-[0.18em] text-white disabled:opacity-60">
            {pending ? 'Verifying…' : 'Restore booking access'}
          </button>
          <div className="mt-4 flex items-center justify-between gap-4 font-body text-sm">
            <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null); setNotice(null) }} className="text-primary underline-offset-4 hover:underline">
              Use another email
            </button>
            <button type="button" onClick={resend} disabled={resendIn > 0 || pending} className="text-accent underline-offset-4 hover:underline disabled:text-dark/40">
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {notice && <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-accent/25 bg-cream px-4 py-3 font-body text-sm text-dark/75">{notice}</p>}
      {error && <p role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-body text-sm text-red-800">{error}</p>}
    </div>
  )
}
