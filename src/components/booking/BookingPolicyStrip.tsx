import { Clock3, ShieldAlert, Users2 } from 'lucide-react'

const items = [
  {
    icon: Clock3,
    label: 'Reschedule, cancel & refunds via WhatsApp only',
  },
  {
    icon: ShieldAlert,
    label: 'Advance payments are non-refundable',
  },
  {
    icon: Users2,
    label: 'Strict same-gender therapist protocol',
  },
]

/**
 * Tight policy strip shown above every booking surface. Pulls the three
 * clinic rules into a single glance before the visitor
 * starts picking slots — so nothing on the confirmation screen is a
 * surprise.
 */
export default function BookingPolicyStrip() {
  return (
    <div className="relative overflow-hidden border-y border-accent/20 bg-white/70 backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 0% 50%, rgba(181, 138, 59,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 100% at 100% 50%, rgba(20, 148, 71,0.05) 0%, transparent 60%)',
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6 sm:py-2.5 lg:px-10">
        {items.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className="flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary/70 sm:text-[10px] sm:tracking-[0.16em]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.2} />
            <span>{label}</span>
            {i < items.length - 1 && (
              <span
                aria-hidden
                className="ml-6 hidden h-3 w-px bg-accent/25 sm:inline-block"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
