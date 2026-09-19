import Link from 'next/link'

interface TherapyMidCTAProps {
  treatmentId: string
  treatmentTitle: string
  whatsappHref: string
}

export default function TherapyMidCTA({
  treatmentId,
  treatmentTitle,
  whatsappHref,
}: TherapyMidCTAProps) {
  return (
    <div className="my-10 rounded-xl bg-primary p-8 text-center text-white sm:p-12">
      <div className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
        Begin your journey
      </div>
      <h3 className="mt-3 font-heading text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[30px]">
        Book {treatmentTitle}
        <br />
        with our Vaidya
      </h3>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={`/book/treatment?id=${treatmentId}`}
          className="rounded bg-accent px-5 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Book this treatment
        </Link>
        <Link
          href="/book/consultation"
          className="rounded border border-white/40 px-5 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Free Consultation
        </Link>
        <Link
          href={whatsappHref}
          className="rounded border border-white/40 px-5 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          WhatsApp
        </Link>
      </div>
    </div>
  )
}
