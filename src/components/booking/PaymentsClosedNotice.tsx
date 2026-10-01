import Link from 'next/link'
import { MessageCircle, ArrowRight } from 'lucide-react'

import { whatsappLink } from '@/lib/clinic'

/**
 * Shown in place of the treatment booking form while online payment isn't set
 * up yet (see `onlinePaymentsAvailable`). Treatments are booked by WhatsApp in
 * the meantime, and a free consultation is still bookable online. It
 * disappears on its own once the payment keys are configured.
 */
export default function PaymentsClosedNotice({ treatmentTitle }: { treatmentTitle?: string }) {
  const message = treatmentTitle
    ? `Hi, I'd like to book ${treatmentTitle}.`
    : "Hi, I'd like to book a treatment."

  return (
    <div className="rounded-2xl border border-accent/30 bg-white/70 px-8 py-10 text-center">
      <MessageCircle className="mx-auto h-6 w-6 text-accent" strokeWidth={2} aria-hidden />
      <h2 className="mt-3 font-heading text-[20px] font-extrabold text-primary">
        Online treatment booking opens soon
      </h2>
      <p className="mx-auto mt-2 max-w-md font-body text-[14px] leading-relaxed text-dark/65">
        {treatmentTitle ? <>To book <strong className="font-semibold text-primary">{treatmentTitle}</strong> now, </> : 'To book a treatment now, '}
        WhatsApp us and our team will arrange your slot. You can also start with a free
        consultation online.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={whatsappLink(message)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
        >
          Book on WhatsApp
        </a>
        <Link
          href="/book/consultation"
          className="inline-flex items-center gap-2 rounded-xl border border-accent/40 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent hover:bg-accent/5"
        >
          Free consultation
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
