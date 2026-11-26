'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, X } from 'lucide-react'
import { VACANCY } from '@/lib/careers'

/**
 * "We're hiring" strip across the top of every page. It pulses gently (not
 * at all for visitors who ask for reduced motion) and can be closed for the
 * rest of the visit; it comes back on their next visit.
 */
export default function HiringStrip() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(sessionStorage.getItem('awc-hiring-strip') !== '1')
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem('awc-hiring-strip', '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  return (
    <div className="relative bg-[#C8102E] px-10 py-2 text-center font-body text-[12.5px] font-semibold text-white sm:text-[13.5px]" role="region" aria-label="Job vacancy">
      <Link href="/careers" className="hiring-pulse inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 hover:underline">
        <Briefcase className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-heading font-extrabold uppercase tracking-[0.08em]">We are hiring!</span>
        <span>{VACANCY.title}</span>
        <span className="rounded-full bg-white px-2.5 py-0.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#C8102E]">Apply now</span>
      </Link>
      <button onClick={dismiss} aria-label="Close job vacancy notice" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .hiring-pulse { animation: hiring-pulse 1.6s ease-in-out infinite; }
          @keyframes hiring-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        }
      `}</style>
    </div>
  )
}
