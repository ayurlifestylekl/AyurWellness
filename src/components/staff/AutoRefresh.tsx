'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Near-live sync: re-fetches the current server component tree every
 * `intervalMs` and on window focus. Cheap stand-in for realtime sockets so
 * the doctor / admin / front-desk panels stay in step.
 */
export default function AutoRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const tick = () => router.refresh()
    const id = setInterval(tick, intervalMs)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [router, intervalMs])
  return null
}
