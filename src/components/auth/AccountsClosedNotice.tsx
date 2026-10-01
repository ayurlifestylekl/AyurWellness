import Link from 'next/link'
import { Hourglass, ArrowRight } from 'lucide-react'

import { whatsappLink } from '@/lib/clinic'

type Variant = 'member' | 'reset' | 'partner'

const COPY: Record<Variant, { eyebrow: string; title: string; body: string }> = {
  member: {
    eyebrow: 'Opening soon',
    title: 'Member accounts open soon',
    body:
      'Online sign-in and order tracking are opening shortly. You don’t need an account to book — reserve a free consultation as a guest, or message us on WhatsApp and we’ll arrange everything for you.',
  },
  reset: {
    eyebrow: 'Opening soon',
    title: 'Password reset by email isn’t available yet',
    body:
      'Member accounts open soon, so there’s nothing to reset for now — and you don’t need an account to book. Staff: please ask the centre’s administrator to reset your password.',
  },
  partner: {
    eyebrow: 'Opening soon',
    title: 'Brand Partner accounts open soon',
    body:
      'Partners join by invitation, and invitations are sent by email once the programme opens. Interested in joining? Apply on WhatsApp and we’ll be in touch.',
  },
}

/**
 * Shown on the sign-in / sign-up / reset pages while member accounts aren't
 * open yet (see `memberAccountsOpen`). Disappears on its own once the host
 * sets MEMBER_ACCOUNTS_OPEN=true.
 */
export default function AccountsClosedNotice({
  variant = 'member',
  className = '',
}: {
  variant?: Variant
  className?: string
}) {
  const c = COPY[variant]
  const partner = variant === 'partner'

  return (
    <div
      role="status"
      className={`rounded-2xl border border-accent/30 bg-white/70 px-6 py-8 text-center sm:px-8 ${className}`}
    >
      <Hourglass className="mx-auto h-6 w-6 text-accent" strokeWidth={2} aria-hidden />
      <span className="mt-3 block font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
        {c.eyebrow}
      </span>
      <h2 className="mt-2 font-heading text-[20px] font-extrabold leading-tight text-primary">{c.title}</h2>
      <p className="mx-auto mt-2 max-w-md font-body text-[14px] leading-relaxed text-dark/65">{c.body}</p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {partner ? (
          <>
            <a
              href={whatsappLink("Hi Ayurvedic Wellness Centre, I'm interested in the Brand Partner program.")}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
            >
              Apply on WhatsApp
            </a>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 rounded-xl border border-accent/40 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent hover:bg-accent/5"
            >
              About the programme
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/book/consultation"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
            >
              Book a free consultation
            </Link>
            <a
              href={whatsappLink("Hi, I'd like to book with Ayurvedic Wellness Centre.")}
              className="inline-flex items-center gap-2 rounded-xl border border-accent/40 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent hover:bg-accent/5"
            >
              WhatsApp us
            </a>
          </>
        )}
      </div>
    </div>
  )
}
