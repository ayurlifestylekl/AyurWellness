import { extrasFor } from '@/lib/booking/extras'

/** Add-ons offered with this therapy (e.g. Hair Wash), shown on its page. Renders nothing when there are none. */
export default function TherapyAddOns({ treatmentKey }: { treatmentKey: string }) {
  const extras = extrasFor(treatmentKey)
  if (!extras.length) return null
  return (
    <section aria-labelledby="addons-heading" className="rounded-xl border border-accent/30 bg-cream/60 p-5">
      <h2 id="addons-heading" className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Add-on available</h2>
      <ul className="mt-2 space-y-2">
        {extras.map((e) => (
          <li key={e.code}>
            <p className="font-heading text-[16px] font-bold text-primary">
              {e.label} <span className="text-accent">+ RM{e.priceRm}</span>{' '}
              <span className="font-body text-[13px] font-normal text-dark/55">· {e.mins} min</span>
            </p>
            <p className="font-body text-[14px] leading-relaxed text-dark/70">{e.description} Choose it when you book.</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
