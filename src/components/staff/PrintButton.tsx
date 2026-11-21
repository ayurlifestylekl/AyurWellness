'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-accent/30 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60"
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  )
}
