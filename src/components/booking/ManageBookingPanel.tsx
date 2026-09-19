import { CreditCard, MessageCircle } from 'lucide-react'

import { STATUS_LABEL } from '@/lib/booking/status'
import type { BookingManagementModel } from '@/lib/booking/management'
import { getTreatmentImageUrl } from '@/lib/storefront/booking'
import { fmtMY } from '@/lib/datetime'
import { whatsappLink } from '@/lib/clinic'

const paymentLabels: Record<BookingManagementModel['payment']['display'], string> = {
  free: 'No payment required',
  unpaid: 'Not paid',
  pending: 'Payment pending',
  paid: 'Paid',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
  refund_needs_review: 'Refund needs review',
}

export default async function ManageBookingPanel({ model }: { model: BookingManagementModel }) {
  const amount = model.payment.amountRm == null ? null : `RM${model.payment.amountRm.toFixed(2)}`
  const isActiveGroup = model.groupMembers.length > 1
    && model.groupMembers.some((member) => member.id === model.id)
  const imageUrl = !isActiveGroup && model.treatmentId ? await getTreatmentImageUrl(model.treatmentId) : null

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr] lg:gap-12">
      <aside className="lg:sticky lg:top-10 lg:self-start">
        <div className="overflow-hidden rounded-[26px] bg-white shadow-luxe ring-1 ring-accent/10">
          <div
            className="h-52 bg-cover bg-center"
            style={{ backgroundImage: `url('${imageUrl || '/authentic-ayurveda.jpg'}')` }}
          />
          <div className="p-7">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              {model.bookingKind === 'consultation' ? 'Free consultation' : 'Treatment booking'}
            </span>
            <h1 className="mt-2 font-display text-[27px] font-bold leading-tight text-primary">
              {model.treatmentName}
            </h1>
            <dl className="mt-5 space-y-3 border-t border-accent/15 pt-5 font-body text-[13px]">
              <Row label="Guest" value={model.patientName} />
              <Row label="Selected time" value={fmtMY(model.selectedTime, { dateStyle: 'full', timeStyle: 'short' })} />
              <Row label="Status" value={STATUS_LABEL[model.status as keyof typeof STATUS_LABEL] ?? model.status} />
              <Row label={model.bookingKind === 'consultation' ? 'Vaidya' : 'Therapist'} value={model.therapist} />
              <Row label="Payment" value={`${paymentLabels[model.payment.display]}${amount ? ` · ${amount}` : ''}`} />
            </dl>
          </div>
        </div>
      </aside>

      <div>
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Manage booking
          </span>
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
          Need to make a change?
        </h2>
        <p className="mt-3 max-w-xl font-body text-[14px] leading-6 text-dark/65">
          Rescheduling, cancellations, and refund requests are handled directly via WhatsApp — message us and our team will take care of it.
        </p>

        <div className="mt-7 rounded-2xl bg-white p-6 ring-1 ring-accent/15">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 flex-none text-accent" />
            <div>
              <h3 className="font-heading text-[14px] font-bold text-primary">
                Need to reschedule, cancel, or ask about a refund?
              </h3>
              <p className="mt-1 font-body text-[13px] leading-5 text-dark/65">
                Message us on WhatsApp and our team will take care of it directly.
              </p>
            </div>
          </div>
          <a
            href={whatsappLink(`Hi, I'd like to manage my booking (${model.treatmentName}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
          >
            Message us on WhatsApp
          </a>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-accent/15">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 flex-none text-accent" />
            <div>
              <h3 className="font-heading text-[13px] font-bold text-primary">Payment status</h3>
              <p className="mt-1 font-body text-[13px] leading-5 text-dark/65">
                {paymentLabels[model.payment.display]}{amount ? ` · ${amount}` : ''}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-dark/45">{label}</dt>
      <dd className="text-right font-semibold text-dark/75">{value}</dd>
    </div>
  )
}
