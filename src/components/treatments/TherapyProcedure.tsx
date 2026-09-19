import type { ProcedureStep } from '@/types/treatments'

interface TherapyProcedureProps {
  steps: ProcedureStep[]
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']

export default function TherapyProcedure({ steps }: TherapyProcedureProps) {
  if (steps.length === 0) return null
  return (
    <ol className="divide-y divide-accent/20">
      {steps.map((step, i) => (
        <li key={i} className="grid grid-cols-[56px_1fr] items-start gap-5 py-4">
          <span
            aria-hidden
            className="font-display text-[32px] italic leading-none text-accent"
          >
            {ROMAN[i] ?? String(i + 1)}.
          </span>
          <div>
            <h4 className="font-heading text-[15px] font-bold text-primary">
              {step.title}
            </h4>
            <p className="mt-1 font-body text-[14px] leading-[1.55] text-dark/72">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
