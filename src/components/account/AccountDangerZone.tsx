'use client'

import { useState } from 'react'
import { HeartCrack, Trash2 } from 'lucide-react'
import DataExportButton from './DataExportButton'
import DeleteAccountDialog from './DeleteAccountDialog'

export default function AccountDangerZone() {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <section className="rounded-3xl border border-dashed border-[#006B3C]/12 bg-white px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <HeartCrack className="h-3.5 w-3.5 text-[#12372D]/55" strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-[14px] font-semibold text-[#006B3C]">
            Account & data
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-[#12372D]/65" style={{ lineHeight: 1.6 }}>
            Download a copy of everything we hold about you, or close your account.
            Deletion anonymizes your personal data immediately and removes your sign-in
            after a 30-day cooling-off period.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DataExportButton />
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50/40 px-5 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-red-700 transition-all hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {showDelete && <DeleteAccountDialog onClose={() => setShowDelete(false)} />}
    </section>
  )
}
