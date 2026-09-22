import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Landmark, ArrowLeft, ShieldCheck } from 'lucide-react'

import { getBookingForPayment, getGroupMembers, getTreatmentImageUrl } from '@/lib/storefront/booking'
import { reconcileAppointment } from '@/lib/booking/payment'
import { sweepExpiredBookingsSafe } from '@/lib/booking/expiry'
import { canAccessBooking } from '@/lib/booking/access'
import { fmtMY } from '@/lib/datetime'
import { bookingRef } from '@/lib/booking/ref'
import CancelBookingButton from '@/components/booking/CancelBookingButton'
import HoldCountdown from '@/components/booking/HoldCountdown'

export const metadata: Metadata = {
  title: 'Checkout — Ayurvedic Wellness Centre',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { t?: string; payerror?: string }
}) {
  let b = await getBookingForPayment(params.id)
  if (!b) notFound()
  const token = searchParams.t
  if (!(await canAccessBooking(b.id, b.customerId, token))) notFound()
  const tokenQuery = token ? `?t=${token}` : ''
  const statusHref = `/book/request/${b.id}${tokenQuery}`

  // Self-heal, same as the status page: catch a missed webhook, and release
  // an overdue hold, before deciding what to show.
  if (b.status === 'awaiting_payment') {
    const reconciled = await reconcileAppointment(params.id)
    if (reconciled === 'confirmed') {
      b = (await getBookingForPayment(params.id)) ?? b
    } else {
      const swept = await sweepExpiredBookingsSafe()
      if (swept && swept.expired > 0) b = (await getBookingForPayment(params.id)) ?? b
    }
  }

  const members = b.groupId ? await getGroupMembers(b.groupId) : []
  const isGroup = members.length > 1
  const groupTotal = isGroup ? members.reduce((s, m) => s + (m.payableAmountRm ?? 0), 0) : null
  const groupAllAwaiting = isGroup && members.every((m) => m.status === 'awaiting_payment')

  // Nothing to check out — already paid, cancelled, still under review, or a
  // group that isn't fully approved yet. Send them to the full status page.
  if (b.status !== 'awaiting_payment' || (isGroup && !groupAllAwaiting)) {
    redirect(statusHref)
  }

  const amount = isGroup ? groupTotal : b.payableAmountRm

  // Fetch treatment images to display the actual therapy photo
  const treatmentImageUrls: Map<string, string | null> = new Map()
  if (!isGroup && b.treatmentId) {
    treatmentImageUrls.set(b.treatmentId, await getTreatmentImageUrl(b.treatmentId))
  } else if (isGroup) {
    const uniqueIds = Array.from(new Set(members.map((m) => m.treatmentId).filter((id): id is string => !!id)))
    await Promise.all(uniqueIds.map(async (id) => treatmentImageUrls.set(id, await getTreatmentImageUrl(id))))
  }
  
  // Use the first treatment image, or fallback to logo if no image available
  const primaryImage = Array.from(treatmentImageUrls.values()).find((url): url is string => !!url) ?? '/kerala-logo.png'

  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-cream">
      {/* Ambient warmth — a quiet gold/burgundy glow, not a flat flood of colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 45% at 12% 0%, rgba(181,138,59,0.12) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(0,107,60,0.07) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <Link
          href={statusHref}
          className="group inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary/55 transition-colors duration-300 hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
          Back to booking status
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:gap-12">
          {/* Left — the reservation itself, anchored by a real photo. */}
          <div className="lg:sticky lg:top-10">
            <div className="overflow-hidden rounded-[26px] bg-white shadow-luxe ring-1 ring-accent/10">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream/50">
                <img 
                  src={primaryImage} 
                  alt={b.treatmentName ?? 'Treatment'} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
                  <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                    Your reservation
                  </span>
                  <span className="ml-auto font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/50">
                    Ref #{bookingRef(b.id)}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.01em] text-primary">
                  {isGroup ? `Group of ${members.length}` : b.treatmentName ?? 'Your appointment'}
                </h1>

                {isGroup ? (
                  <ul className="mt-5 space-y-4 border-t border-accent/15 pt-5">
                    {members.map((m) => (
                      <li key={m.id} className="flex items-start justify-between gap-2 font-body text-[13px]">
                        <span className="min-w-0">
                          <span className="text-dark/80">{m.patientName ?? '—'}</span>
                          <span className="block text-[12px] text-dark/55">{m.treatmentName ?? ''}</span>
                          <span className="block text-[12px] font-semibold text-dark/75">
                            {fmtMY(m.appointmentDatetime ?? m.requestedDatetime, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </span>
                        <span className="flex-none font-heading text-[12px] text-dark/70">
                          {m.payableAmountRm != null ? `RM${m.payableAmountRm}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 font-body text-[13.5px] text-dark/60">
                    {fmtMY(b.appointmentDatetime ?? b.requestedDatetime, { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-accent/15 pt-5">
                  <span className="font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-dark/50">
                    Total due
                  </span>
                  <span className="font-display text-[26px] font-bold text-accent">RM{amount}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/book/treatment?edit=${b.id}${b.treatmentId ? `&id=${b.treatmentId}` : ''}${token ? `&t=${encodeURIComponent(token)}` : ''}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-accent/20 bg-cream/40 px-4 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-primary transition-all hover:border-accent/40 hover:bg-cream/60"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Edit booking details
                  </Link>
                  <p className="text-center font-body text-[10.5px] text-dark/50">
                    Change treatment, time, or personal information
                  </p>
                </div>
              </div>
            </div>

            {b.paymentExpiresAt && (
              <div className="mt-5 rounded-2xl bg-primary/[0.04] px-5 py-3.5 ring-1 ring-primary/10">
                <HoldCountdown expiresAt={b.paymentExpiresAt} />
              </div>
            )}
          </div>

          {/* Right — the payment decision, given the most visual weight. */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
              <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Checkout</span>
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold leading-tight text-primary">Choose how to pay</h2>
            <p className="mt-1.5 font-body text-[14px] text-dark/55">
              Your slot is held while you complete payment — it&apos;s released automatically if it isn&apos;t finished in time.
            </p>

            {searchParams.payerror && (
              <p className="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-body text-[13.5px] text-red-800">
                The payment couldn&apos;t be started just now. Please try again below — if it keeps happening, message us on WhatsApp and we&apos;ll send you a payment link directly.
              </p>
            )}

            <div className="mt-7 space-y-3.5">
              <Link
                href={`/book/request/${b.id}/pay${tokenQuery}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-accent bg-white p-5 shadow-gold-glow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:p-6"
              >
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-accent/10 transition-colors duration-300 group-hover:bg-accent/15">
                  <Landmark className="h-5 w-5 text-accent" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-[14.5px] font-bold text-primary">Pay securely online</span>
                  <span className="mt-0.5 block font-body text-[12.5px] text-dark/55">FPX, card, e-wallets & more via HitPay — instant confirmation.</span>
                </span>
                <span className="flex-none font-heading text-[12px] font-bold uppercase tracking-[0.1em] text-accent">RM{amount} →</span>
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-1.5 font-body text-[11.5px] text-dark/40">
              <ShieldCheck className="h-3.5 w-3.5 flex-none text-accent/70" />
              Secured checkout — your payment is processed by a licensed provider.
            </p>

            <div className="mt-8 border-t border-accent/15 pt-5">
              <CancelBookingButton id={b.id} token={token} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
