'use client'

import { useState, useTransition } from 'react'
import { captureLead, type LeadSource } from '@/actions/leads/captureLead'

/** Shared name/email/phone capture form used by the welcome popup + WhatsApp gate. */
export default function LeadCaptureForm({
  source,
  submitLabel,
  onCaptured,
}: {
  source: LeadSource
  submitLabel: string
  onCaptured: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email and phone.')
      return
    }
    start(async () => {
      const res = await captureLead({ name, email, phone, source })
      if ('error' in res) setError(res.error)
      else onCaptured()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inp} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className={inp} inputMode="email" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={inp} inputMode="tel" />
      {error && <p className="font-body text-[12.5px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
      >
        {pending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  )
}

const inp =
  'w-full rounded-lg border border-accent/30 bg-white px-3 py-2.5 font-body text-[14px] text-dark placeholder:text-dark/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
