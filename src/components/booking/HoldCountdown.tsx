'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Live countdown to a checkout hold's expiry. Instant-booking holds are short
 * (~20 min) with no reminder email, so this is the only signal a customer
 * gets that the slot is time-limited. Refreshes the page on expiry so a
 * lapsed hold shows the real (released) status instead of a stale countdown.
 */
export default function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter()
  const target = new Date(expiresAt).getTime()
  const [msLeft, setMsLeft] = useState(() => target - Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      const left = target - Date.now()
      setMsLeft(left)
      if (left <= 0) {
        clearInterval(id)
        router.refresh()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [target, router])

  if (msLeft <= 0) return null
  const totalSec = Math.ceil(msLeft / 1000)
  const hours = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const urgent = totalSec < 120
  // Instant bookings hold for ~20 min (live m:ss countdown); staff-approved
  // bookings carry the older 15-hour window, where "14h 32m" reads better
  // than a five-digit minute ticker.
  const label =
    hours > 0 ? `${hours}h ${mins}m` : `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <p
      className={`mb-3 rounded-xl border px-4 py-3 text-center font-body text-[13px] ${
        urgent ? 'border-red-300 bg-red-50 text-red-800' : 'border-accent/30 bg-cream text-dark/70'
      }`}
      role="status"
    >
      This slot is held for <strong>{label}</strong> — pay now to keep it.
    </p>
  )
}
