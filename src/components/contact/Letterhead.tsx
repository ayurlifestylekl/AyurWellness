'use client'

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Check, Feather, Loader2 } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import { fadeUp, inViewOnce } from '@/lib/motion'
import { submitContactMessage, type ContactIntent } from '@/actions/contact'

type Status = 'idle' | 'loading' | 'success' | 'error'

const INTENTS: Array<{ value: ContactIntent; label: string }> = [
  { value: 'treatment', label: 'Treatment' },
  { value: 'product', label: 'Product' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
]

const underlineClass =
  'w-full border-0 border-b-[1.5px] border-primary/20 bg-transparent px-0 pb-2 pt-2 font-body text-[16px] text-dark placeholder:font-body placeholder:italic placeholder:text-dark/35 transition-colors duration-300 focus:border-accent focus:outline-none focus:ring-0 focus:shadow-[0_14px_30px_-14px_rgba(181, 138, 59,0.55)]'

/**
 * Zone 4 — "The Letterhead"
 * The contact form styled as an actual letter. Paper-grained cream panel
 * with a centered letterhead band, auto-current date, "Dear Vaidya,"
 * salutation, small-caps intent chips, underline-only inputs (no boxes),
 * "Yours in wellness," closing, and a "Seal & Send" primary CTA. Preserves
 * the `submitContactMessage` server action and the `?intent=` URL
 * pre-selection.
 */
export default function Letterhead() {
  const [intent, setIntent] = useState<ContactIntent>('treatment')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Read ?intent=... from URL on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const param = params.get('intent')
    if (
      param === 'treatment' ||
      param === 'product' ||
      param === 'corporate' ||
      param === 'other'
    ) {
      setIntent(param)
    }
  }, [])

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur',
      }).format(new Date()),
    []
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage(null)
    startTransition(async () => {
      const result = await submitContactMessage({
        intent,
        name,
        phone: phone.startsWith('+60') ? phone : `+60 ${phone}`,
        email,
        message,
      })
      if (result.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(result.error)
      }
    })
  }

  function handleReset() {
    setStatus('idle')
    setIntent('treatment')
    setName('')
    setPhone('')
    setEmail('')
    setMessage('')
    setErrorMessage(null)
  }

  const busy = status === 'loading' || isPending

  return (
    <section
      id="letterhead"
      aria-labelledby="letterhead-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden scroll-mt-24 bg-cream"
    >
      {/* Atmospheric radials */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 88% 12%, rgba(181, 138, 59,0.09) 0%, transparent 55%), radial-gradient(ellipse 700px 600px at 8% 95%, rgba(0, 107, 60,0.06) 0%, transparent 55%)',
        }}
      />
      <div aria-hidden className="grain-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 lg:px-0 lg:py-12">
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative"
        >
          {/* The letter — paper ground */}
          <div className="relative overflow-hidden rounded-[2px] bg-white px-5 py-6 shadow-floating sm:px-10 sm:py-8 md:px-14 md:py-9">
            {/* Paper texture (very faint) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
              }}
            />

            {/* Inner hairline margin (lg+) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[14px] hidden rounded-[2px] border border-accent/20 md:block"
            />

            {/* Botanical marginalia — far corners, very faint */}
            <svg
              aria-hidden
              viewBox="0 0 60 80"
              className="pointer-events-none absolute left-6 top-8 hidden h-20 w-16 text-accent/25 md:block"
              fill="currentColor"
            >
              <path d="M30 0 C12 15, 5 40, 10 60 C15 70, 25 78, 30 80 C35 78, 45 70, 50 60 C55 40, 48 15, 30 0 Z" />
            </svg>
            <svg
              aria-hidden
              viewBox="0 0 60 80"
              className="pointer-events-none absolute bottom-10 right-6 hidden h-20 w-16 rotate-180 text-accent/25 md:block"
              fill="currentColor"
            >
              <path d="M30 0 C12 15, 5 40, 10 60 C15 70, 25 78, 30 80 C35 78, 45 70, 50 60 C55 40, 48 15, 30 0 Z" />
            </svg>

            <div className="relative">
              {status === 'success' ? (
                <SuccessLetter onReset={handleReset} dateLabel={dateLabel} />
              ) : (
                <>
                  {/* ── Letterhead band ────────────────────── */}
                  <div className="mb-5 text-center">
                    <span
                      aria-hidden
                      className="mx-auto block h-px w-full max-w-md"
                      style={{
                        background:
                          'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7) 15%, rgba(181, 138, 59,0.7) 85%, transparent)',
                      }}
                    />
                    <p
                      id="letterhead-heading"
                      className="mt-3 font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-primary"
                    >
                      Ayurvedic Wellness Centre
                    </p>
                    <p className="mt-1.5 font-heading text-[9px] font-medium uppercase tracking-[0.42em] text-accent/85">
                      Correspondence Department
                    </p>
                    <span
                      aria-hidden
                      className="mx-auto mt-3 block h-px w-full max-w-md"
                      style={{
                        background:
                          'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7) 15%, rgba(181, 138, 59,0.7) 85%, transparent)',
                      }}
                    />
                  </div>

                  {/* ── Salutation row with date ─────────────── */}
                  <div className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <p className="font-body text-[12px] italic text-dark/55">
                        Brickfields, Kuala Lumpur
                      </p>
                      <h2 className="mt-1 font-body font-normal italic leading-[1.05] text-primary"
                        style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.01em' }}
                      >
                        Dear Vaidya,
                      </h2>
                    </div>
                    <p className="font-body text-[12px] italic text-dark/55">
                      {dateLabel}
                    </p>
                  </div>

                  {/* ── Intent chips ─────────────────────────── */}
                  <fieldset className="mb-5">
                    <legend className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.26em] text-primary/60">
                      Regarding
                    </legend>
                    <div
                      role="radiogroup"
                      aria-label="Regarding"
                      className="flex flex-wrap gap-x-6 gap-y-2"
                    >
                      {INTENTS.map((opt) => {
                        const active = intent === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setIntent(opt.value)}
                            className={`group relative inline-flex min-h-[40px] items-center gap-2 pb-1 font-heading text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                              active
                                ? 'text-primary'
                                : 'text-primary/45 hover:text-primary/80'
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`h-[5px] w-[5px] rotate-45 transition-colors duration-300 ${
                                active ? 'bg-accent' : 'bg-primary/25'
                              }`}
                            />
                            {opt.label}
                            <span
                              aria-hidden
                              className={`absolute bottom-0 left-0 right-0 h-[1.5px] origin-left transition-transform duration-400 ${
                                active ? 'scale-x-100 bg-accent' : 'scale-x-0 bg-accent/0'
                              }`}
                            />
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>

                  {/* ── Fields ──────────────────────────────── */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    noValidate
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
                      <FieldUnderline label="Your name" htmlFor="letterhead-name">
                        <input
                          id="letterhead-name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Priya Kumar"
                          autoComplete="name"
                          className={underlineClass}
                        />
                      </FieldUnderline>

                      <FieldUnderline label="Email address" htmlFor="letterhead-email">
                        <input
                          id="letterhead-email"
                          type="email"
                          required
                          maxLength={200}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="priya@example.com"
                          autoComplete="email"
                          className={underlineClass}
                        />
                      </FieldUnderline>
                    </div>

                    <FieldUnderline label="Phone number" htmlFor="letterhead-phone">
                      <div className="relative">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-heading text-[13px] font-bold text-primary/55"
                        >
                          +60
                        </span>
                        <input
                          id="letterhead-phone"
                          type="tel"
                          required
                          minLength={8}
                          maxLength={30}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="11 6504 3436"
                          autoComplete="tel"
                          className={`${underlineClass} pl-10`}
                        />
                      </div>
                    </FieldUnderline>

                    <FieldUnderline
                      label="Your message"
                      htmlFor="letterhead-message"
                      counter={`${message.length}/2000`}
                    >
                      <textarea
                        id="letterhead-message"
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your note here — symptoms, questions, context, anything."
                        className={`${underlineClass} resize-y leading-[1.55]`}
                      />
                    </FieldUnderline>

                    {/* Error */}
                    {status === 'error' && errorMessage && (
                      <p
                        className="rounded-[2px] border-l-2 border-red-800/40 bg-red-800/[0.04] px-4 py-3 font-body text-[13.5px] italic leading-[1.6] text-red-900"
                        role="alert"
                      >
                        {errorMessage}
                      </p>
                    )}

                    {/* Closing row */}
                    <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex flex-col gap-0.5">
                        <p
                          className="font-body font-normal italic text-primary/85"
                          style={{ fontSize: '15px', lineHeight: '1.4' }}
                        >
                          Yours in wellness,
                        </p>
                        <p className="font-body text-[11.5px] italic leading-[1.5] text-dark/55">
                          Reply within one working day · No bots or marketing lists.
                        </p>
                      </div>

                      <CTAButton
                        type="submit"
                        variant="primary"
                        size="md"
                        shimmer
                        icon={
                          busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                          ) : (
                            <Feather className="h-4 w-4" strokeWidth={2.2} />
                          )
                        }
                      >
                        {busy ? 'Sealing…' : 'Seal & Send'}
                      </CTAButton>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FieldUnderline({
  label,
  htmlFor,
  counter,
  children,
}: {
  label: string
  htmlFor: string
  counter?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="font-heading text-[9.5px] font-bold uppercase tracking-[0.26em] text-primary/55"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {counter && (
          <span className="pointer-events-none absolute -bottom-5 right-0 font-heading text-[9.5px] font-semibold tracking-[0.12em] text-primary/40">
            {counter}
          </span>
        )}
      </div>
    </div>
  )
}

function SuccessLetter({
  onReset,
  dateLabel,
}: {
  onReset: () => void
  dateLabel: string
}) {
  return (
    <div className="flex flex-col items-start gap-6 py-4">
      {/* Letterhead band (mirrors form) */}
      <div className="mb-2 w-full text-center">
        <span
          aria-hidden
          className="mx-auto block h-px w-full max-w-md"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7) 15%, rgba(181, 138, 59,0.7) 85%, transparent)',
          }}
        />
        <p className="mt-3 font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">
          Ayurvedic Wellness Centre
        </p>
        <p className="mt-1.5 font-heading text-[9px] font-medium uppercase tracking-[0.42em] text-accent/85">
          Correspondence Department · {dateLabel}
        </p>
        <span
          aria-hidden
          className="mx-auto mt-3 block h-px w-full max-w-md"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7) 15%, rgba(181, 138, 59,0.7) 85%, transparent)',
          }}
        />
      </div>

      {/* Wax seal motif */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/[0.1] shadow-[0_0_0_3px_rgba(181, 138, 59,0.2),0_0_0_6px_rgba(181, 138, 59,0.08)]">
        <Check className="h-6 w-6 text-accent" strokeWidth={2.4} />
      </div>

      <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
        Sealed & received
      </span>

      <h3
        className="font-heading font-extrabold leading-[1.08] tracking-[-0.022em] text-primary"
        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}
      >
        Thank you — I will reply
        <br />
        <span className="font-body italic font-normal text-accent">
          within one working day.
        </span>
      </h3>

      <p className="max-w-[56ch] font-body text-[15.5px] leading-[1.75] text-dark/75">
        Your note is with me now. If the matter is urgent, WhatsApp is the
        fastest line — we answer within the hour during Centre hours.
      </p>

      <div className="mt-2 flex flex-col gap-1">
        <span className="font-body text-[15px] italic text-primary/80">
          Yours in wellness,
        </span>
        <span
          className="font-body italic text-accent"
          style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
        >
          — our Vaidyas
        </span>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-2 border-b border-accent/50 pb-0.5 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70 transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Write another note
      </button>
    </div>
  )
}
