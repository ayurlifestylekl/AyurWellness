'use client'

import { Download } from 'lucide-react'

export default function DataExportButton() {
  return (
    <a
      href="/api/account/export"
      download
      className="inline-flex h-11 items-center gap-2 rounded-full border border-[#006B3C]/15 bg-white px-5 font-heading text-[12px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:bg-[#006B3C]/[0.04]"
    >
      <Download className="h-3.5 w-3.5" />
      Download my data
    </a>
  )
}
