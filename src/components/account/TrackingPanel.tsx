import { Truck, ExternalLink, MapPin } from 'lucide-react'
import CopyButton from './CopyButton'
import { getCourierTrackingUrl } from '@/lib/dashboard/courier-urls'
import type { Database } from '@/lib/database.types'

type CourierService = Database['public']['Tables']['orders']['Row']['courier_service']

interface TrackingPanelProps {
  courier: CourierService | null
  trackingNumber: string | null
  fulfillmentStatus: Database['public']['Tables']['orders']['Row']['fulfillment_status']
}

export default function TrackingPanel({
  courier,
  trackingNumber,
  fulfillmentStatus,
}: TrackingPanelProps) {
  // Don't render if nothing meaningful to show
  if (!courier) return null

  const trackingUrl = getCourierTrackingUrl(courier, trackingNumber)
  const isSelfPickup = courier === 'Self-Pickup'
  const isShipped = fulfillmentStatus === 'shipped' || fulfillmentStatus === 'delivered'

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          {isSelfPickup ? (
            <MapPin className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
          ) : (
            <Truck className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
          )}
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          {isSelfPickup ? 'Pickup details' : 'Shipping & tracking'}
        </h2>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {isSelfPickup ? (
          <div className="space-y-1.5">
            <p className="font-heading text-[12px] font-semibold text-[#006B3C]/55 uppercase tracking-[0.18em]">
              Self-pickup at clinic
            </p>
            <p className="font-body text-[13.5px] text-[#006B3C]">
              Ayurvedic Wellness Centre, Brickfields, KL
            </p>
            <p className="font-body text-[12px] italic text-[#12372D]/55">
              Bring this order number when you collect — we&apos;ll have it ready.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Courier row */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
                Courier
              </span>
              <span
                className="font-heading text-[13.5px] font-semibold text-[#006B3C]"
                style={{ letterSpacing: '-0.005em' }}
              >
                {courier}
              </span>
            </div>

            {/* Tracking number row */}
            {trackingNumber && (
              <div className="flex items-center justify-between gap-3 border-t border-[#006B3C]/6 pt-3">
                <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
                  Tracking number
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-[#006B3C]">
                    {trackingNumber}
                  </span>
                  <CopyButton value={trackingNumber} variant="chip" />
                </div>
              </div>
            )}

            {/* Status hint */}
            {!isShipped && (
              <p className="border-t border-[#006B3C]/6 pt-3 font-body text-[12px] italic text-[#12372D]/55">
                Your order is being prepared. We&apos;ll update the tracking number as soon as it ships.
              </p>
            )}

            {/* External track button */}
            {trackingUrl && isShipped && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#B58A3B] px-5 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
              >
                Track on {courier}
                <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
