import { Stethoscope } from 'lucide-react'

interface PractitionerNoteChipProps {
  note: string | null
}

export default function PractitionerNoteChip({ note }: PractitionerNoteChipProps) {
  if (!note || !note.trim()) return null
  return (
    <aside className="flex items-start gap-3 rounded-2xl border border-[#B58A3B]/35 bg-[#B58A3B]/[0.08] px-4 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#B58A3B]/20">
        <Stethoscope className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/65">
          Note from Vaidya
        </p>
        <p className="mt-1 font-body text-[13px] leading-[1.6] text-[#12372D]/80 whitespace-pre-wrap">
          {note}
        </p>
      </div>
    </aside>
  )
}
