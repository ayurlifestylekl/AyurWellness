'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { markContacted } from '@/lib/staff/actions'
import { fmtMY } from '@/lib/datetime'

/**
 * "Contacted via WhatsApp" flag for an open request — lets admin see the centre
 * has already reached out before approving. Shown on console/doctor detail pages.
 */
export default function MarkContactedButton({ id, contactedAt }: { id: string; contactedAt: string | null }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (contactedAt) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 font-body text-[12.5px] text-green-800">
        <MessageCircle className="h-4 w-4 flex-none" />
        Customer contacted · {fmtMY(contactedAt, { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    )
  }

  const onClick = () => {
    setError(null)
    start(async () => {
      const res = await markContacted(id)
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-green-700 hover:bg-green-50 disabled:opacity-60"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {pending ? 'Saving…' : 'Mark contacted (WhatsApp)'}
      </button>
      {error && <p className="mt-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-body text-[12px] text-red-700">{error}</p>}
    </div>
  )
}
