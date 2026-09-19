import Link from 'next/link'
import { ArrowUpRight, MessageCircle, ShieldAlert } from 'lucide-react'

import type { Treatment } from '@/types/treatments'

interface ConsultationRequiredNoticeProps {
  treatment: Treatment
}

/**
 * Replaces the treatment embed when the selected treatment has
 * `requiresConsultation: true`. We do not let visitors book the therapy
 * directly — our Vaidyas need to assess first. The CTA routes to the
 * free consultation flow, with a WhatsApp fallback.
 */
export default function ConsultationRequiredNotice({
  treatment,
}: ConsultationRequiredNoticeProps) {
  const whatsappHref = `https://wa.me/601163393436?text=${encodeURIComponent(
    `Hi, I'd like to discuss the "${treatment.title}" treatment. I understand it needs a consultation first.`,
  )}`

  return (
    <section
      aria-labelledby="consultation-required-heading"
      className="relative overflow-hidden rounded-2xl border border-accent/30 bg-white p-8 sm:p-10 lg:p-12"
      style={{
        boxShadow:
          '0 2px 6px rgba(20, 148, 71,0.04), 0 24px 60px -24px rgba(20, 148, 71,0.18)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 0% 0%, rgba(181, 138, 59,0.14) 0%, transparent 45%), radial-gradient(ellipse at 100% 100%, rgba(20, 148, 71,0.06) 0%, transparent 45%)',
        }}
      />

      <div className="relative flex flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5">
          <ShieldAlert
            className="h-3.5 w-3.5 text-accent"
            strokeWidth={2.2}
          />
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            Consultation Required First
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h2
            id="consultation-required-heading"
            className="font-heading text-2xl font-extrabold leading-[1.1] tracking-[-0.02em] text-primary sm:text-3xl"
          >
            {treatment.title} needs a personal assessment.
          </h2>
          <p className="max-w-xl font-body text-[15px] leading-[1.7] text-dark/70">
            This protocol is designed around your dosha and any medication,
            pregnancy, or chronic condition you&apos;re managing — so our Vaidya
            needs to meet you first before the therapy can be booked. The
            consultation is free, takes 30 minutes, and you can pick your slot
            right now.
          </p>
        </div>

        <div
          aria-hidden
          className="h-px w-16"
          style={{
            background:
              'linear-gradient(to right, rgba(181, 138, 59,0.7), rgba(181, 138, 59,0.1))',
          }}
        />

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link
            href="/book/consultation"
            className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-dark transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.97]"
            style={{
              boxShadow: '0 12px 32px -12px rgba(181, 138, 59,0.8)',
            }}
          >
            <span>Book Free Consultation</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2.4}
            />
          </Link>
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-primary/25 bg-white px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-[transform,border-color,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.97]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            <span>Ask on WhatsApp</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
