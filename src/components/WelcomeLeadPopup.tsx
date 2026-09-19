'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Sparkles } from 'lucide-react'
import LeadCaptureForm from './LeadCaptureForm'

const SEEN = 'kal-welcome-seen'
const CAPTURED = 'kal-lead-captured'

/**
 * Welcome popup shown immediately on the first visit. Captures name/email/phone
 * for deals — and is dismissible (unlike the WhatsApp gate). Shown once per
 * visitor (remembered in the browser).
 */
export default function WelcomeLeadPopup() {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN) !== '1') setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const close = () => {
    try {
      localStorage.setItem(SEEN, '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  const captured = () => {
    try {
      localStorage.setItem(SEEN, '1')
      localStorage.setItem(CAPTURED, '1') // also satisfies the WhatsApp gate
    } catch {
      /* ignore */
    }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-2xl bg-cream p-7 shadow-elevated">
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded p-1 text-dark/40 hover:text-primary">
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-4 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-accent" />
            <h2 className="mt-2 font-heading text-[20px] font-extrabold text-primary">You&rsquo;re on the list!</h2>
            <p className="mt-1 font-body text-[13.5px] text-dark/65">We&rsquo;ll be in touch with exclusive Ayurvedic offers.</p>
            <button onClick={close} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-accent/40 px-6 font-heading text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary hover:bg-white">
              Explore the site
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-white px-3 py-1 font-heading text-[9.5px] font-bold uppercase tracking-[0.18em] text-accent">
                <Sparkles className="h-3 w-3" /> Members get more
              </span>
              <h2 className="mt-3 font-heading text-[22px] font-extrabold leading-tight text-primary">Join for exclusive deals</h2>
              <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-dark/65">
                Leave your details for members-only offers, seasonal wellness tips, and first access to new therapies.
              </p>
            </div>

            <div className="mt-4">
              <LeadCaptureForm source="welcome_popup" submitLabel="Get exclusive deals" onCaptured={captured} />
            </div>

            <p className="mt-3 text-center font-body text-[12px] text-dark/55">
              Prefer an account?{' '}
              <Link href="/auth/register" className="font-semibold text-accent underline-offset-2 hover:underline" onClick={close}>
                Create your account
              </Link>
            </p>
            <button onClick={close} className="mt-1 block w-full text-center font-body text-[12px] text-dark/45 hover:text-dark/70">
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  )
}
