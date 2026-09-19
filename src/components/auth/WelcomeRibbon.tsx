'use client'

import { useEffect, useState } from 'react'
import { Gift, X } from 'lucide-react'

const STORAGE_KEY = 'kal-welcome-ribbon-dismissed'

/**
 * Small gold-tinted ribbon shown on the Create Account tab as a soft
 * conversion nudge. Dismissible — choice persists in localStorage.
 */
export default function WelcomeRibbon() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY) === '1') setDismissed(true)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // localStorage unavailable (private mode etc.) — fine, dismissal lasts this session.
    }
  }

  if (dismissed) return null

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#B58A3B]/35 bg-[#B58A3B]/10 px-4 py-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#B58A3B]">
        <Gift className="h-4 w-4" />
      </span>
      <p className="flex-1 font-body text-[12.5px] leading-relaxed text-white/80">
        <span className="font-semibold text-white">New here?</span> Get{' '}
        <span className="font-semibold text-[#B58A3B]">RM 10 off</span> your first order when you create an account.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white/85"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
