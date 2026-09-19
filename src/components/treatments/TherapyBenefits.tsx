interface TherapyBenefitsProps {
  items: string[]
}

export default function TherapyBenefits({ items }: TherapyBenefitsProps) {
  if (items.length === 0) return null
  return (
    <ul className="grid grid-cols-1 gap-x-7 gap-y-1 sm:grid-cols-2">
      {items.map((b) => (
        <li
          key={b}
          className="flex items-start gap-3 border-b border-accent/15 py-2.5 font-body text-[14px] leading-[1.5] text-dark/78"
        >
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            aria-hidden
          />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}
