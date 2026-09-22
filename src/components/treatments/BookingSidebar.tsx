import Link from 'next/link'
import type { ReactNode } from 'react'

import type { TreatmentPricing } from '@/types/treatments'
import { formatPrice, leadTimeLabel } from '@/data/treatments'

interface BookingSidebarProps {
  treatmentId: string
  treatmentTitle: string
  duration: string | null
  sessionsRecommended: string | null
  whatsappHref: string
  pricing: TreatmentPricing
}

const PREP_TIPS = [
  'Arrive 10 minutes early to settle in',
  'Avoid heavy meals right before your session',
  'Stay well hydrated through the day',
  "Follow your therapist's post-care advice",
]

const ASSURANCES = [
  'KKM-registered T&CM Ayurveda therapists',
  'Authentic Ayurvedic protocols & medicated oils',
  'Brickfields, Kuala Lumpur',
]

export default function BookingSidebar({
  treatmentId,
  treatmentTitle,
  duration,
  sessionsRecommended,
  whatsappHref,
  pricing,
}: BookingSidebarProps) {
  const priceText = formatPrice(pricing)
  const lead = leadTimeLabel(pricing)
  const isEnquiry = pricing.bookingType === 'enquiry'
  const needsConsult = pricing.bookingType === 'consultation'

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-4">
      {/* Primary: booking card — sticky so it follows the long article */}
      <div className="sticky top-24 flex flex-col gap-4">
        <div className="relative rounded-xl border border-accent/40 bg-white p-5 shadow-elevated">
          <span className="absolute -top-2 right-3 rounded bg-accent px-2 py-0.5 font-heading text-[8px] font-bold uppercase tracking-[0.2em] text-white">
            Booking
          </span>

          <div className="mb-3 font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
            {treatmentTitle}
          </div>

          <dl className="divide-y divide-accent/20">
            <Row label="Duration" value={duration ?? 'See practitioner'} />
            <Row label="Sessions" value={sessionsRecommended ?? 'Per session'} />
            <Row label="Price" value={priceText} valueClass="text-accent" />
          </dl>

          {(needsConsult || lead) && (
            <p className="mt-3 rounded bg-cream px-3 py-2 font-body text-[11px] leading-snug text-dark/70">
              {needsConsult
                ? 'A practitioner consultation is required before this therapy.'
                : `${lead}.`}
            </p>
          )}

          <Link
            href={isEnquiry ? whatsappHref : `/book/treatment?id=${treatmentId}`}
            className="mt-4 block rounded bg-accent px-4 py-3 text-center font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isEnquiry ? 'Enquire to Book' : needsConsult ? 'Book Consultation' : 'Book Treatment'}
          </Link>
          <Link
            href={whatsappHref}
            className="mt-2 block rounded border border-primary/40 px-4 py-3 text-center font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            WhatsApp Us
          </Link>
        </div>

        {/* Secondary: prepare for your visit */}
        <Panel title="Prepare for your visit">
          <ul className="space-y-2">
            {PREP_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2 font-body text-[12.5px] leading-snug text-dark/70">
                <Mark />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Tertiary: assurance */}
        <Panel title="Our assurance">
          <ul className="space-y-2">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex gap-2 font-body text-[12.5px] leading-snug text-dark/70">
                <Mark />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-[11.5px] italic leading-snug text-dark/55">
            Every therapy is tailored after a free consultation with our therapist.
          </p>
        </Panel>
      </div>
    </aside>
  )
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 font-heading text-[11px]">
      <dt className="tracking-[0.1em] text-dark/55">{label.toUpperCase()}</dt>
      <dd className={`font-bold text-dark ${valueClass}`}>{value}</dd>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-accent/25 bg-white/60 p-5">
      <div className="mb-3 flex items-center gap-2 font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
        <span className="h-3 w-px bg-accent" aria-hidden />
        {title}
      </div>
      {children}
    </div>
  )
}

function Mark() {
  return (
    <span
      aria-hidden
      className="mt-[6px] h-1.5 w-1.5 flex-none rotate-45 bg-accent/70"
    />
  )
}
