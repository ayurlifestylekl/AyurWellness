import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, MessageCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import { whatsappLink } from '@/lib/clinic'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'How cancellations, rescheduling and refunds work for treatments and consultations at Ayurvedic Wellness Centre.',
  alternates: { canonical: '/cancellation' },
}

const RULES = [
  {
    icon: CalendarClock,
    title: '48 hours’ notice',
    body: 'We require at least 48 hours’ notice for cancellations or rescheduling, so we can offer your therapist’s time to another guest.',
  },
  {
    icon: RotateCcw,
    title: 'Rescheduling',
    body: 'You can move your booking to another date yourself from your account, up to 24 hours before your appointment.',
  },
  {
    icon: ShieldCheck,
    title: 'Advance payments',
    body: 'Advance payments made to secure a treatment slot are non-refundable, but they can be transferred to another date or another guest with sufficient notice.',
  },
]

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8 md:py-20">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-accent">Policies</span>
        <h1 className="mt-3 font-heading text-[32px] font-bold leading-tight text-primary sm:text-[42px]" style={{ letterSpacing: '-0.025em' }}>
          Cancellation &amp; refund policy
        </h1>
        <p className="mt-4 font-body text-[15px] leading-relaxed text-dark/65">
          We keep our treatment rooms and therapists reserved for you. These guidelines help us look after every guest fairly.
        </p>

        <div className="mt-10 grid gap-4">
          {RULES.map((r) => (
            <section key={r.title} className="flex gap-4 rounded-2xl border border-accent/15 bg-white/70 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-[#E4C384]">
                <r.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="font-heading text-[17px] font-bold text-primary">{r.title}</h2>
                <p className="mt-1.5 font-body text-[14.5px] leading-relaxed text-dark/70">{r.body}</p>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="font-heading text-[20px] font-bold text-primary">How to cancel or request a refund</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 font-body text-[14.5px] leading-relaxed text-dark/70">
            <li>Open your booking from your account (or the link in your confirmation email) and cancel it, giving a short reason.</li>
            <li>If your booking is eligible, submit a refund request from the same page.</li>
            <li>Our team reviews every request and will approve or decline it, and let you know.</li>
          </ol>
          <p className="mt-5 font-body text-[14.5px] leading-relaxed text-dark/70">
            A refund request is eligible when it is made at least 48 hours before your appointment, or within 1 hour of booking in
            case you booked by mistake. Outside these windows, please contact us and we will do our best to help.
          </p>
        </section>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-primary p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[14.5px] text-white/80">Need to change a booking at short notice? Message us directly.</p>
          <a
            href={whatsappLink('Hi, I need help with my booking.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#E4C384] px-5 font-heading text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp us
          </a>
        </div>

        <p className="mt-8 font-body text-[13px] text-dark/50">
          See also our <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">frequently asked questions</Link>.
        </p>
      </div>
    </main>
  )
}
