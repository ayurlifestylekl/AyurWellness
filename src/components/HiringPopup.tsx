'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, X } from 'lucide-react'
import { VACANCY, applyMailto } from '@/lib/careers'
import { WELCOME_POPUP_CLOSED, WELCOME_SEEN_KEY, popupAllowedOn } from '@/lib/popups'
import CopyEmailButton from './CopyEmailButton'

const SEEN = 'awc-hiring-popup'

/**
 * "We are hiring" popup shown when a visitor arrives. It appears once per
 * visit (it returns on their next visit), a moment after the page loads. For a
 * first-time visitor it waits until the welcome sign-up popup has been closed,
 * and it never appears on booking, payment or account pages.
 */
export default function HiringPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const markSeen = () => {
    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* ignore */
    }
  }
  const close = useCallback(() => {
    markSeen()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!popupAllowedOn(pathname)) return
    let seen = false
    let welcomePending = false
    try {
      seen = sessionStorage.getItem(SEEN) === '1'
      welcomePending = localStorage.getItem(WELCOME_SEEN_KEY) !== '1'
    } catch {
      /* storage blocked: show it once per page load */
    }
    if (seen) return

    let timer: ReturnType<typeof setTimeout> | undefined
    const showSoon = (ms: number) => {
      timer = setTimeout(() => setOpen(true), ms)
    }
    const onWelcomeClosed = () => showSoon(500)

    if (welcomePending) window.addEventListener(WELCOME_POPUP_CLOSED, onWelcomeClosed, { once: true })
    else showSoon(1500)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener(WELCOME_POPUP_CLOSED, onWelcomeClosed)
    }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`We are hiring: ${VACANCY.title}`}
        className="relative max-h-[94vh] w-full max-w-[400px] overflow-y-auto rounded-2xl bg-cream shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-dark/70 shadow hover:text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <Image
          src={VACANCY.poster}
          alt="We are hiring: Admin Assistant at Ayurvedic Wellness Centre. Basic salary RM2,500 to RM3,000 plus commissions. Send your resume to ayurvedicwellness2026@gmail.com."
          width={1086}
          height={1448}
          sizes="400px"
          priority
          className="h-auto max-h-[62vh] w-full object-contain"
        />

        <div className="flex flex-col gap-2 p-4">
          <a
            href={applyMailto()}
            onClick={markSeen}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#C8102E] px-7 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#a60d26]"
          >
            <Mail className="h-4 w-4" aria-hidden /> Apply now
          </a>
          <div className="flex items-center justify-between gap-3">
            <Link href="/careers" onClick={close} className="font-body text-[13px] font-semibold text-primary underline-offset-2 hover:underline">
              See the full details
            </Link>
            <CopyEmailButton
              email={VACANCY.applyEmail}
              className="inline-flex items-center gap-1.5 font-body text-[13px] text-dark/60 hover:text-primary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
