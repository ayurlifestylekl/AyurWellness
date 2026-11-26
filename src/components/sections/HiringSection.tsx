import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'
import { VACANCY, applyMailto } from '@/lib/careers'

/** Home page vacancy section: the poster beside the key details and the apply buttons. */
export default function HiringSection() {
  return (
    <section aria-labelledby="hiring-heading" className="bg-cream py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 sm:px-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-12">
        <Link href="/careers" aria-label="Read about the Admin Assistant vacancy">
          <Image
            src={VACANCY.poster}
            alt="We are hiring: Admin Assistant at Ayurvedic Wellness Centre. Basic salary RM2,500 to RM3,000 plus commissions. Send your resume to ayurvedicwellness2026@gmail.com."
            width={1100}
            height={1467}
            sizes="(max-width: 768px) 90vw, 360px"
            className="mx-auto w-full max-w-[360px] rounded-2xl border border-accent/20 shadow-lg"
          />
        </Link>
        <div>
          <span className="inline-block rounded-full bg-[#C8102E] px-3 py-1 font-heading text-[10.5px] font-bold uppercase tracking-[0.18em] text-white">Now hiring</span>
          <h2 id="hiring-heading" className="mt-3 font-heading text-[28px] font-extrabold leading-tight text-primary sm:text-[36px]" style={{ letterSpacing: '-0.02em' }}>
            Join our team as an {VACANCY.title}
          </h2>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-dark/70">
            Be part of a supportive, friendly team at Ayurvedic Wellness Centre. Basic salary <strong>RM2,500 – RM3,000</strong> based on experience, plus attractive commissions based on performance.
          </p>
          <p className="mt-3 flex items-start gap-2 font-body text-[14px] text-dark/65">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> {VACANCY.location}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={applyMailto()} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#C8102E] px-7 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#a60d26]">
              <Mail className="h-4 w-4" aria-hidden /> Apply now
            </a>
            <Link href="/careers" className="inline-flex min-h-[48px] items-center rounded-full border border-primary/40 px-7 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/5">
              See the full details
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
