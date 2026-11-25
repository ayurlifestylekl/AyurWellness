import Image from 'next/image'
import { VIP_ROOMS, extrasFor, vipRoomFor } from '@/lib/booking/extras'

const money = (n: number) => `RM ${n.toFixed(2)}`

/**
 * Upgrades and add-ons for this therapy, shown on its page: the VIP Private
 * Room (with the price worked out) and any add-on such as Hair Wash.
 */
export default function TherapyAddOns({ treatmentKey, price }: { treatmentKey: string; price: number | null }) {
  const extras = extrasFor(treatmentKey)
  if (!extras.length) return null
  const rooms = extras.filter((e) => e.kind === 'room')
  const addOns = extras.filter((e) => e.kind !== 'room')
  const room = VIP_ROOMS[vipRoomFor(treatmentKey)]
  return (
    <div className="mt-8 flex flex-col gap-4">
      {rooms.map((e) => (
        <section key={e.code} aria-label={e.label} className="rounded-xl border border-accent/30 bg-white p-5">
          <div className="flex gap-4">
            <Image src={room.photo} alt={`The ${room.label}`} width={120} height={160} className="h-[120px] w-[90px] flex-none rounded-lg object-cover sm:h-[136px] sm:w-[102px]" />
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Upgrade</p>
              <p className="mt-1 font-heading text-[18px] font-bold text-primary">{e.label}</p>
              <p className="font-body text-[14px] leading-relaxed text-dark/70">{e.description}</p>
              <p className="mt-1 font-heading text-[18px] font-bold text-accent">+ RM {e.priceRm}</p>
            </div>
          </div>
          {price != null && (
            <dl className="mt-4 divide-y divide-accent/15 border-t border-accent/15 font-body text-[14px]">
              <div className="flex justify-between py-2"><dt className="text-dark/65">Standard treatment price</dt><dd className="tabular-nums">{money(price)}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-dark/65">VIP room upgrade</dt><dd className="tabular-nums">{money(e.priceRm)}</dd></div>
              <div className="flex justify-between py-2 font-semibold text-primary"><dt>Total with VIP room</dt><dd className="tabular-nums">{money(price + e.priceRm)}</dd></div>
            </dl>
          )}
          <p className="mt-2 font-body text-[12.5px] text-dark/55">Choose it when you book. The standard treatment room is included in the price.</p>
        </section>
      ))}
      {addOns.length > 0 && (
        <section aria-label="Add-on available" className="rounded-xl border border-accent/30 bg-cream/60 p-5">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Add-on available</p>
          <ul className="mt-2 space-y-2">
            {addOns.map((e) => (
              <li key={e.code}>
                <p className="font-heading text-[16px] font-bold text-primary">
                  {e.label} <span className="text-accent">+ RM{e.priceRm}</span>
                  {e.mins > 0 && <span className="font-body text-[13px] font-normal text-dark/55"> · {e.mins} min</span>}
                </p>
                <p className="font-body text-[14px] leading-relaxed text-dark/70">{e.description} Choose it when you book.</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
