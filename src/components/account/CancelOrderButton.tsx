'use client'

import { useState, useTransition } from 'react'
import { XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelOrder } from '@/actions/orders/cancelOrder'

interface CancelOrderButtonProps {
  orderId: string
  orderShortId: string
}

export default function CancelOrderButton({ orderId, orderShortId }: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const res = await cancelOrder(orderId, reason)
      if (res.ok) {
        toast.success(`Order #${orderShortId} cancelled.`)
        setOpen(false)
        setReason('')
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50/40 px-4 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-red-700 transition-all hover:bg-red-50 active:scale-[0.98]"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#006B3C]/8 bg-white p-6">
            <h3 className="font-heading text-[16px] font-bold text-[#006B3C]">
              Cancel order #{orderShortId}?
            </h3>
            <p className="mt-2 font-body text-[13px] text-[#12372D]/70">
              Tell us briefly why — this helps us improve. Cancelling is final.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. ordered by mistake, changed my mind"
              className="mt-3 w-full resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30"
              disabled={isPending}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-[#006B3C]/15 px-4 py-2 font-heading text-[12px] font-semibold text-[#006B3C]"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || reason.trim().length < 5}
                className="rounded-full bg-red-600 px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
              >
                {isPending ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
