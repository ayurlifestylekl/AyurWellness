import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, CreditCard, CalendarCheck, XCircle, ArrowLeft } from 'lucide-react'

import { getBookingForPayment, getGroupMembers, getTreatmentImageUrl } from '@/lib/storefront/booking'
import { reconcileAppointment } from '@/lib/booking/payment'
import { sweepExpiredBookingsSafe } from '@/lib/booking/expiry'
import { STATUS_LABEL } from '@/lib/booking/status'
import { canAccessBooking } from '@/lib/booking/access'
import { flowLabels } from '@/lib/booking/flow-copy'
import { fmtMY } from '@/lib/datetime'
import { bookingRef } from '@/lib/booking/ref'
import HoldCountdown from '@/components/booking/HoldCountdown'

export const metadata: Metadata = {
  title: 'Manage your booking — Ayurvedic Wellness Centre',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function BookingRequestPage({
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
  const tokenQuery = token ? `?t=${encodeURIComponent(token)}` : ''

  // Self-heal: if the customer is back from the gateway but the webhook hasn't
  // confirmed yet (missed or failed signature), verify with the provider's API
  // and confirm here so a paid booking is never left hanging. Likewise, an
  // overdue hold is expired on view so the page never shows a payable booking
  // whose window has actually closed.
  if (b.status === 'awaiting_payment') {
    const reconciled = await reconcileAppointment(params.id)
    if (reconciled === 'confirmed') {
      b = (await getBookingForPayment(params.id)) ?? b
    } else {
      const swept = await sweepExpiredBookingsSafe()
      if (swept && swept.expired > 0) b = (await getBookingForPayment(params.id)) ?? b
    }
  }

  // Group bookings: load all guests for the combined view + payment.
  const members = b.groupId ? await getGroupMembers(b.groupId) : []
  const isGroup = members.length > 1
  const groupTotal = isGroup ? members.reduce((s, m) => s + (m.payableAmountRm ?? 0), 0) : null
  const groupAllAwaiting = isGroup && members.every((m) => m.status === 'awaiting_payment')

  // Instant bookings skip staff review entirely (no 'pending' stop, no
  // approved_at stamp) — showing a "Clinic approval" step for them would be
  // misleading, so only the old staff-approved flow gets that step.
  const wasStaffApproved = b.status === 'pending' || b.approvedAt != null
  const isConfirmed = ['confirmed', 'checked_in', 'in_progress', 'completed'].includes(b.status)
  const when = b.appointmentDatetime ?? b.requestedDatetime
  const whenText = fmtMY(when, { dateStyle: 'full', timeStyle: 'short' })
  const amount = isGroup
    ? groupTotal != null
      ? `RM${groupTotal}`
      : null
    : b.payableAmountRm != null
      ? `RM${b.payableAmountRm}`
      : null
  const labels = flowLabels(b.bookingKind, b.status, b.approvedAt)
  const complete = ['confirmed', 'checked_in', 'in_progress', 'completed'].includes(b.status)

  const LOGO_URL = '/kerala-logo.png'
  const treatmentImageUrls: Map<string, string | null> = new Map()
  if (!isGroup && b.treatmentId) {
    treatmentImageUrls.set(b.treatmentId, await getTreatmentImageUrl(b.treatmentId))
  } else if (isGroup) {
    const uniqueIds = Array.from(new Set(members.map((m) => m.treatmentId).filter((id): id is string => !!id)))
    await Promise.all(uniqueIds.map(async (id) => treatmentImageUrls.set(id, await getTreatmentImageUrl(id))))
  }

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
          href="/book"
          className="group inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary/55 transition-colors duration-300 hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5" />
          Back to booking
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:gap-12">
          {/* Left — the reservation itself, anchored by a real photo. */}
          <div className="lg:sticky lg:top-10">
            <div className="overflow-hidden rounded-[26px] bg-white shadow-luxe ring-1 ring-accent/10">
              <div className="flex flex-col items-center justify-center gap-4 bg-cream/50 px-7 py-8">
                <img src={LOGO_URL} alt="Ayurvedic Wellness Centre" className="h-14 w-auto object-contain" />
                <div className="flex -space-x-2 overflow-hidden">
                  {Array.from(treatmentImageUrls.values())
                    .filter((url): url is string => !!url)
                    .slice(0, 4)
                    .map((url, i) => (
                      <div
                        key={i}
                        className="relative inline-block h-10 w-10 flex-none rounded-full border-2 border-white bg-cover bg-center shadow-sm"
                        style={{ backgroundImage: `url('${url}')` }}
                        aria-hidden
                      />
                    ))}
                </div>
              </div>
              <div className="p-7">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
                  <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                    {b.bookingKind === 'consultation' ? 'Free consultation' : 'Treatment booking'}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.01em] text-primary">
                  {b.treatmentName ?? 'Your appointment'}
                </h1>

                {/* Details */}
                <dl className="mt-5 space-y-2.5 border-t border-accent/15 pt-5 font-body text-[13.5px]">
                  <Row label="Booking ref" value={`#${bookingRef(b.id)}`} />
                  {!isGroup && <Row label="Selected time" value={fmtMY(b.requestedDatetime, { dateStyle: 'full', timeStyle: 'short' })} />}
                  {!isGroup && isConfirmed && b.appointmentDatetime && <Row label="Confirmed time" value={fmtMY(b.appointmentDatetime, { dateStyle: 'full', timeStyle: 'short' })} />}
                  {isGroup ? <Row label="Guests" value={`${members.length} guests`} /> : <Row label="Guest" value={b.patientName ?? '—'} />}
                  <Row label="Status" value={STATUS_LABEL[b.status]} />
                  {!isGroup && b.assignedTherapistName && <Row label="Therapist" value={b.assignedTherapistName} />}
                </dl>

                {isGroup && (
                  <div className="mt-5 border-t border-accent/15 pt-5">
                    <div className="mb-3 font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Group guests — each has their own time</div>
                    <ul className="space-y-3">
                      {members.map((m) => (
                        <li key={m.id} className="flex items-start justify-between gap-2 font-body text-[13px]">
                          <span className="min-w-0">
                            <span className="text-dark/80">{m.patientName ?? '—'} <span className="text-dark/45">· {m.patientGender}</span></span>
                            <span className="block text-[12px] text-dark/55">{m.treatmentName ?? ''}</span>
                            <span className="block text-[12px] font-semibold text-dark/75">
                              {fmtMY(m.appointmentDatetime ?? m.requestedDatetime, { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </span>
                          <span className="flex-none font-heading text-[10px] uppercase tracking-[0.1em] text-dark/55">{STATUS_LABEL[m.status]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {amount && (
                  <div className="mt-5 flex items-center justify-between border-t border-accent/15 pt-5">
                    <span className="font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-dark/50">
                      {isGroup ? 'Total' : 'Price'}
                    </span>
                    <span className="font-display text-[26px] font-bold text-accent">{amount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — status timeline + contextual action, given the most visual weight. */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
              <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Status</span>
            </div>

            {/* Status timeline */}
            <ol className="mt-4 space-y-4">
              {labels.map((label) => {
                const icon = label === 'Payment' ? CreditCard : label === 'Clinic approval' ? Clock : label === 'Cancelled' ? XCircle : label === 'Slot selected' ? CheckCircle2 : CalendarCheck
                const done = label === 'Slot selected' || label === 'Cancelled' || (label === 'Clinic approval' && b.status !== 'pending') || ((label === 'Confirmed' || label === 'Confirmation' || label === 'Payment') && complete)
                const sub = label === 'Slot selected' ? whenText : label === 'Payment' ? (b.status === 'awaiting_payment' ? 'Pay to secure your slot.' : complete && amount ? `${amount} paid` : '') : label === 'Clinic approval' ? (b.status === 'pending' ? 'Our team is reviewing this historical request.' : 'Approved by our clinic.') : label === 'Cancelled' ? (b.cancellationReason || 'This booking was cancelled.') : complete ? (isGroup ? 'Each guest’s time is listed below.' : whenText) : 'Instant confirmation follows payment.'
                return <Step key={label} done={done} icon={icon} label={label} sub={sub} tone={label === 'Cancelled' ? 'danger' : undefined} />
              })}
            </ol>

            {/* Contextual CTA */}
            <div className="mt-8 border-t border-accent/15 pt-7">
              {searchParams.payerror && b.status === 'awaiting_payment' && (
                <p className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-body text-[13.5px] text-red-800">
                  The payment couldn&apos;t be started just now. Please try again below — if it keeps happening, message us on WhatsApp and we&apos;ll send you a payment link directly.
                </p>
              )}
              {b.status === 'pending' && (
                <p className="rounded-xl bg-white px-5 py-4 font-body text-[13.5px] text-dark/70 ring-1 ring-accent/10">
                  This is a historical booking request that still needs clinic review. We&apos;ll email you when its status changes. You can also bookmark this page and check back here.
                </p>
              )}
              {b.status === 'awaiting_payment' && (!isGroup || groupAllAwaiting) && wasStaffApproved && (
                <p className="mb-3 font-body text-[12.5px] italic text-dark/55">
                  Good news — this has been approved! If our approval email didn&apos;t reach you (do check Spam/Junk), you can pay right here.
                </p>
              )}
              {b.status === 'awaiting_payment' && (!isGroup || groupAllAwaiting) && b.paymentExpiresAt && (
                <div className="mb-4 rounded-2xl bg-primary/[0.04] px-5 py-3.5 ring-1 ring-primary/10">
                  <HoldCountdown expiresAt={b.paymentExpiresAt} />
                </div>
              )}
              {b.status === 'awaiting_payment' &&
                (isGroup && !groupAllAwaiting ? (
                  <p className="rounded-xl bg-white px-5 py-4 font-body text-[13.5px] text-dark/70 ring-1 ring-accent/10">
                    This historical group request still has guests awaiting clinic review. Group payment becomes available after every guest has been reviewed.
                  </p>
                ) : (
                  <Link
                    href={`/book/request/${b.id}/checkout${tokenQuery}`}
                    className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-accent px-7 font-heading text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-gold-glow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                  >
                    Continue to payment — {amount}
                  </Link>
                ))}
              {['confirmed', 'checked_in', 'in_progress', 'completed'].includes(b.status) && when && (
                <div className="space-y-3">
                  {/* The Vaidya cleared this consultation — close the loop by letting
                      the customer book the actual treatment right from here. */}
                  {b.bookingKind === 'consultation' && b.treatmentUnlocked && (
                    <div className="rounded-2xl bg-white px-5 py-5 ring-1 ring-accent/20">
                      <p className="font-body text-[13.5px] text-dark/80">
                        Good news — our Vaidya has cleared you for treatment. You can now book and pay for your therapy.
                      </p>
                      <Link
                        href={`/book/treatment?from=${b.id}&ct=${token ?? ''}${b.treatmentId ? `&id=${b.treatmentId}` : ''}`}
                        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-6 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
                      >
                        Book your treatment →
                      </Link>
                    </div>
                  )}
                  <p className="rounded-xl border border-green-500/30 bg-green-50 px-4 py-3 font-body text-[13.5px] text-green-800">
                    {isGroup
                      ? <>Your group booking is confirmed — each guest&apos;s time is listed above. Same-gender therapists as requested.</>
                      : <>You&apos;re confirmed for <strong>{whenText}</strong>. Same-gender therapist as requested.</>}
                  </p>
                  {b.bookingKind === 'treatment' && !b.assignedTherapistName && (
                    <p className="rounded-xl bg-white px-4 py-3 font-body text-[13px] text-dark/70 ring-1 ring-accent/10">Your slot is confirmed. Our team will assign the best-matched therapist before your visit.</p>
                  )}
                </div>
              )}
              {b.status === 'cancelled' && (
                <div className="space-y-3">
                  <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-body text-[13.5px] text-red-800">
                    This booking was cancelled.{b.cancellationReason ? ` Reason: ${b.cancellationReason}` : ''}
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-7 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-accent/90"
                  >
                    Book again
                  </Link>
                </div>
              )}
            </div>

            {['pending', 'scheduled', 'awaiting_payment', 'confirmed'].includes(b.status) && (
              <div className="mt-6 border-t border-accent/15 pt-5">
                <Link
                  href={`/book/request/${b.id}/manage${tokenQuery}`}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary/35 bg-white px-7 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/5"
                >
                  Manage booking
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({
  done, icon: Icon, label, sub, tone = 'normal',
}: { done: boolean; icon: React.ComponentType<{ className?: string }>; label: string; sub?: string; tone?: 'normal' | 'danger' }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className={`mt-0.5 h-5 w-5 flex-none ${tone === 'danger' ? 'text-red-500' : done ? 'text-accent' : 'text-dark/25'}`} />
      <div>
        <div className={`font-heading text-[13px] font-bold ${done || tone === 'danger' ? 'text-primary' : 'text-dark/45'}`}>{label}</div>
        {sub && <div className="font-body text-[12.5px] text-dark/55">{sub}</div>}
      </div>
    </li>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-dark/50">{label}</dt>
      <dd className="text-right font-semibold text-dark">{value}</dd>
    </>
  )
}
