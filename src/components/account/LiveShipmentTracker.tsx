'use client'

import { useEffect, useRef, useState } from 'react'
import { Truck, ExternalLink, ChevronDown, MessageCircle } from 'lucide-react'
import { getCourierTrackingUrl } from '@/lib/dashboard/courier-urls'
import type { OrderListItem } from '@/lib/dashboard/order-queries'

interface LiveShipmentTrackerProps {
  shipments: OrderListItem[]
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

function whatsappFallbackUrl(orderShortId: string): string {
  return `https://wa.me/601163393436?text=${encodeURIComponent(
    `Hi Ayurvedic Wellness Centre, I'd like a status update on order #${orderShortId}.`
  )}`
}

interface ResolvedShipment {
  order: OrderListItem
  trackUrl: string | null
}

function resolve(order: OrderListItem): ResolvedShipment {
  return {
    order,
    trackUrl: getCourierTrackingUrl(order.courier_service, order.tracking_number),
  }
}

export default function LiveShipmentTracker({ shipments }: LiveShipmentTrackerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Newest-first, capped at 5 to keep the popover tidy
  const resolved: ResolvedShipment[] = shipments
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(resolve)

  // Close on click-outside + Esc
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (resolved.length === 0) return null

  // Single-shipment direct CTA
  if (resolved.length === 1) {
    const { order, trackUrl } = resolved[0]
    const sub = `${order.courier_service ?? 'Courier'}${
      order.tracking_number ? ` · ${order.tracking_number}` : ''
    }`

    return (
      <section
        className="relative overflow-hidden rounded-3xl border border-[#B58A3B]/25 bg-[#EDF4E7]/55 px-4 py-3 sm:px-5"
        style={{
          boxShadow:
            '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
        }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 pl-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
              <Truck className="h-4 w-4 text-[#006B3C]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p
                className="font-heading text-[13px] font-semibold text-[#006B3C]"
                style={{ letterSpacing: '-0.005em' }}
              >
                1 package in transit
              </p>
              <p className="truncate font-body text-[11.5px] text-[#12372D]/60">
                #{shortId(order.id)} · {sub}
              </p>
            </div>
          </div>

          {trackUrl ? (
            <a
              href={trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#B58A3B] px-5 font-heading text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
            >
              Track my order
              <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          ) : (
            <a
              href={whatsappFallbackUrl(shortId(order.id))}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#006B3C]/15 bg-white px-5 font-heading text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#006B3C] transition-all hover:border-[#006B3C]/35 active:scale-[0.98]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp us
            </a>
          )}
        </div>
      </section>
    )
  }

  // Multi-shipment: button toggles popover
  const allUnmapped = resolved.every((r) => !r.trackUrl)
  const couriers = Array.from(
    new Set(resolved.map((r) => r.order.courier_service).filter(Boolean))
  )
  const courierSub =
    couriers.length === 1 ? couriers[0] : `${couriers.length} couriers`

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-[#B58A3B]/25 bg-[#EDF4E7]/55 px-4 py-3 sm:px-5"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
            <Truck className="h-4 w-4 text-[#006B3C]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p
              className="font-heading text-[13px] font-semibold text-[#006B3C]"
              style={{ letterSpacing: '-0.005em' }}
            >
              {resolved.length} packages in transit
            </p>
            <p className="font-body text-[11.5px] text-[#12372D]/60">
              {courierSub}
              {allUnmapped ? ' · tracking pending' : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#B58A3B] px-5 font-heading text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
        >
          Track my order
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Popover */}
      {open && (
        <div
          role="menu"
          className="absolute right-3 z-30 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white"
          style={{
            top: '100%',
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <div className="border-b border-[#006B3C]/6 px-4 py-2">
            <p className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
              Pick a shipment
            </p>
          </div>
          <ul>
            {resolved.map(({ order, trackUrl }, idx) => {
              const sid = shortId(order.id)
              const isLast = idx === resolved.length - 1
              const borderCls = isLast ? '' : 'border-b border-[#006B3C]/6'

              if (trackUrl) {
                return (
                  <li key={order.id} role="none">
                    <a
                      role="menuitem"
                      href={trackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className={`group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#EDF4E7]/55 ${borderCls}`}
                    >
                      <div className="min-w-0">
                        <p className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
                          #{sid} · {order.courier_service}
                        </p>
                        {order.tracking_number && (
                          <p className="truncate font-mono text-[11px] text-[#12372D]/55">
                            {order.tracking_number}
                          </p>
                        )}
                      </div>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-[#006B3C]/45 transition-colors group-hover:text-[#B58A3B]"
                        strokeWidth={2}
                      />
                    </a>
                  </li>
                )
              }

              return (
                <li key={order.id} role="none">
                  <a
                    role="menuitem"
                    href={whatsappFallbackUrl(sid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#EDF4E7]/55 ${borderCls}`}
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
                        #{sid}
                      </p>
                      <p className="truncate font-body text-[11px] italic text-[#12372D]/55">
                        Tracking unavailable · WhatsApp us
                      </p>
                    </div>
                    <MessageCircle
                      className="h-3.5 w-3.5 shrink-0 text-[#006B3C]/45 transition-colors group-hover:text-[#B58A3B]"
                      strokeWidth={2}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
