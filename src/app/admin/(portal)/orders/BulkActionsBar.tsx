'use client'

import { useState } from 'react'
import { bulkMarkPaid } from '@/lib/admin/orders/actions'

export default function BulkActionsBar({ selectedIds }: { selectedIds: string[] }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (selectedIds.length === 0) return null

  async function handleBulkPaid() {
    setPending(true)
    setMessage(null)
    const r = await bulkMarkPaid(selectedIds, 'bank_transfer')
    setPending(false)
    if (r.ok) {
      const updated = (r as { ok: true; data?: { updated: number } }).data?.updated ?? 0
      setMessage(`Marked ${updated} as paid (bank transfer).`)
      setTimeout(() => location.reload(), 700)
    } else {
      setMessage(r.error)
    }
  }

  function handleBatchPrint(type: 'label' | 'slip') {
    window.open(
      `/admin/orders/batch-print?ids=${encodeURIComponent(selectedIds.join(','))}&type=${type}`,
      '_blank',
    )
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7] p-3">
      <span className="text-[12px] font-semibold text-[#006B3C]">
        {selectedIds.length} selected
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={handleBulkPaid}
        className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
      >
        Mark paid (bank transfer)
      </button>
      <button
        type="button"
        onClick={() => handleBatchPrint('label')}
        className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C]"
      >
        Print address labels
      </button>
      <button
        type="button"
        onClick={() => handleBatchPrint('slip')}
        className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C]"
      >
        Print packing slips
      </button>
      {message ? (
        <span className="text-[11.5px] text-[#12372D]/70">{message}</span>
      ) : null}
    </div>
  )
}
