'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { replyToTicket } from '@/lib/admin/messages/actions'

export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState('')
  const [markResolved, setMarkResolved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await replyToTicket({ ticketId, body, markResolved })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setBody('')
      setMarkResolved(false)
      location.reload()
    })
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
        Reply to customer
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder="Hi [name], thanks for reaching out…"
        className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12px]">
          <input
            type="checkbox"
            checked={markResolved}
            onChange={(e) => setMarkResolved(e.target.checked)}
          />
          Mark as resolved after sending
        </label>
        <button
          type="submit"
          disabled={pending || body.trim().length < 1}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
      {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
    </form>
  )
}
