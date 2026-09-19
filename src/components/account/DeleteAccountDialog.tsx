'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { requestAccountDeletion } from '@/actions/account/requestAccountDeletion'

interface DeleteAccountDialogProps {
  onClose: () => void
}

export default function DeleteAccountDialog({ onClose }: DeleteAccountDialogProps) {
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await requestAccountDeletion(confirm)
        // If the action succeeded it will redirect; we only land here on error.
        if (res && !res.ok) toast.error(res.error)
      } catch {
        // redirect() throws a NEXT_REDIRECT — that's the success path.
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6">
        <h3 className="font-heading text-[18px] font-bold text-red-700">Delete your account?</h3>
        <p className="mt-3 font-body text-[13.5px] text-[#12372D]/80" style={{ lineHeight: 1.65 }}>
          This will anonymize your personal details, sign you out, and queue your account
          for full deletion. Order records are retained (anonymized) for accounting and
          regulatory reasons. This cannot be undone.
        </p>
        <p className="mt-4 font-body text-[12.5px] text-[#12372D]/65">
          Type <strong className="font-heading">DELETE MY ACCOUNT</strong> to confirm:
        </p>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-[#006B3C]/15 px-4 py-2 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || confirm !== 'DELETE MY ACCOUNT'}
            className="rounded-full bg-red-600 px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
