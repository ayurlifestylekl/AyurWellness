'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { callGuest } from '@/lib/staff/queue-actions'

/** Call a waiting guest to a room: the lobby screen shows the number and says it aloud. */
export default function CallGuestButton({ id, room, calledAt, callCount }: { id: string; room: string | null; calledAt: string | null; callCount: number }) {
  const router = useRouter()
  const [where, setWhere] = useState(room ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const when = calledAt ? new Date(calledAt).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' }) : null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <input
        value={where}
        onChange={(e) => setWhere(e.target.value)}
        maxLength={40}
        placeholder="Room"
        aria-label="Room to call the guest to"
        className="w-20 rounded-md border border-accent/30 bg-white px-2 py-1 font-body text-[12.5px] focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await callGuest(id, where)
            setMsg(res.ok ? null : res.error)
            if (res.ok) router.refresh()
          })
        }
        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-heading text-[10.5px] font-bold uppercase tracking-[0.1em] text-white hover:bg-primary/90 disabled:opacity-50"
      >
        <Megaphone className="h-3.5 w-3.5" aria-hidden /> {callCount > 0 ? 'Call again' : 'Call'}
      </button>
      {when && <span className="font-body text-[11.5px] text-dark/55">Called {callCount > 1 ? `${callCount}× · ` : ''}{when}</span>}
      {msg && <span className="w-full font-body text-[11.5px] text-red-700">{msg}</span>}
    </div>
  )
}
