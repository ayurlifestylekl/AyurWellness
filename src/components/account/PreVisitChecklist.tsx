import { Check } from 'lucide-react'

interface PreVisitChecklistProps {
  items: string[]
  /** Optional small section label; defaults to "Before your visit". */
  label?: string
}

export default function PreVisitChecklist({
  items,
  label = 'Before your visit',
}: PreVisitChecklistProps) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
        {label}
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#006B3C]/[0.08]">
              <Check className="h-2.5 w-2.5 text-[#006B3C]" strokeWidth={2.4} />
            </span>
            <span
              className="font-body text-[12.5px] text-[#12372D]/75"
              style={{ lineHeight: 1.5 }}
            >
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
