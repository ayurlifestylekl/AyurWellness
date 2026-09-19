'use client'

import { useEffect, useState } from 'react'
import { X, Megaphone, CalendarX } from 'lucide-react'

/**
 * Dismissible top strip for a customer announcement (a closure or a message).
 * Dismissal is remembered per announcement id.
 */
export default function AnnouncementNotice({
  id,
  text,
  variant,
}: {
  id: string
  text: string
  variant: 'closure' | 'message'
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(localStorage.getItem(`kal-anno-${id}`) !== '1')
    } catch {
      setShow(true)
    }
  }, [id])

  if (!show) return null

  const dismiss = () => {
    try {
      localStorage.setItem(`kal-anno-${id}`, '1')
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  const Icon = variant === 'closure' ? CalendarX : Megaphone

  return (
    <div className={`relative px-9 py-2 text-center font-body text-[12.5px] text-white sm:text-[13.5px] ${variant === 'closure' ? 'bg-primary' : 'bg-[#B58A3B]'}`}>
      <Icon className="mr-1.5 inline-block h-4 w-4 -translate-y-0.5" aria-hidden />
      {text}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/70 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
