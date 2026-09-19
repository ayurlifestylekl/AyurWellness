'use client'

import { useState } from 'react'
import { Gift } from 'lucide-react'
import BulkVoucherPushDialog from './BulkVoucherPushDialog'

export default function CustomerBulkActions({
  selectedIds,
}: {
  selectedIds: string[]
}) {
  const [pushOpen, setPushOpen] = useState(false)
  if (selectedIds.length === 0) return null

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7] p-3">
      <span className="text-[12px] font-semibold text-[#006B3C]">
        {selectedIds.length} selected
      </span>
      <button
        type="button"
        onClick={() => setPushOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#B58A3B] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#B58A3B]"
      >
        <Gift className="h-3.5 w-3.5" /> Push voucher
      </button>
      {pushOpen ? (
        <BulkVoucherPushDialog
          customerIds={selectedIds}
          onClose={() => setPushOpen(false)}
        />
      ) : null}
    </div>
  )
}
