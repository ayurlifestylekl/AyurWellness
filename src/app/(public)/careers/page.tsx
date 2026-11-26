import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Check, MapPin, Mail, Wallet } from 'lucide-react'
import { CLINIC_DOMAIN, CLINIC_LEGAL_NAME, CLINIC_NAME } from '@/lib/clinic'
import { HIRING_OPEN, VACANCY, applyMailto } from '@/lib/careers'
import CopyEmailButton from '@/components/CopyEmailButton'

export const metadata: Metadata = {
  title: HIRING_OPEN ? `Careers: ${VACANCY.title}` : 'Careers',
  description: HIRING_OPEN
    ? `We are hiring an ${VACANCY.title} at Ayurvedic Wellness Centre, Brickfields, Kuala Lumpur. Basic salary RM2,500 to RM3,000 plus commissions.`
    : 'Careers at Ayurvedic Wellness Centre.',
  alternates: { canonical: '/careers' },
}

// Lets Google show the vacancy in job search results.
const jobPostingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: VACANCY.title,
  description: `<p>${VACANCY.duties.join('.</p><p>')}.</p>`,
  datePosted: VACANCY.datePosted,
  employmentType: 'FULL_TIME',
  hiringOrganization: { '@type': 'Organization', name: CLINIC_LEGAL_NAME, sameAs: `https://${CLINIC_DOMAIN}`, logo: `https://${CLINIC_DOMAIN}/icon.png` },
  jobLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', streetAddress: 'No. 68-3, Jalan Padang Belia, Brickfields', addressLocality: 'Kuala Lumpur', postalCode: '50470', addressCountry: 'MY' },
  },
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'MYR',
    value: { '@type': 'QuantitativeValue', minValue: VACANCY.salaryMin, maxValue: VACANCY.salaryMax, unitText: 'MONTH' },
  },
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-cream">
      {HIRING_OPEN && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8 md:py-20">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-accent">Careers</span>

        {!HIRING_OPEN ? (
          <>
            <h1 className="mt-3 font-heading text-[32px] font-bold leading-tight text-primary sm:text-[42px]" style={{ letterSpacing: '-0.025em' }}>
              No vacancies right now
            </h1>
            <p className="mt-4 max-w-xl font-body text-[15px] leading-relaxed text-dark/65">
              Thank you for your interest in {CLINIC_NAME}. We have no open positions at the moment. Please check back soon.
            </p>
            <Link href="/" className="mt-6 inline-block font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-primary underline">Back to home</Link>
          </>
        ) : (
          <div className="mt-3 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-14">
            <div>
              <h1 className="font-heading text-[32px] font-bold leading-tight text-primary sm:text-[42px]" style={{ letterSpacing: '-0.025em' }}>
                We are hiring: {VACANCY.title}
              </h1>
              <p className="mt-4 font-body text-[15px] leading-relaxed text-dark/70">
                Be part of our team at {CLINIC_NAME}, a natural, traditional and holistic care centre in Brickfields, Kuala Lumpur.
              </p>

              <h2 className="mt-8 font-heading text-[18px] font-bold text-primary">What you will do</h2>
              <ul className="mt-3 space-y-2">
                {VACANCY.duties.map((d) => (
                  <li key={d} className="flex gap-2.5 font-body text-[14.5px] leading-relaxed text-dark/75">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {d}
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-accent/20 bg-white/70 p-5">
                  <p className="flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent"><Wallet className="h-4 w-4" aria-hidden /> Pay</p>
                  <p className="mt-1.5 font-heading text-[20px] font-extrabold text-primary">RM2,500 – RM3,000</p>
                  <p className="font-body text-[13px] text-dark/65">Basic salary, based on experience. Plus attractive commissions based on performance.</p>
                </div>
                <div className="rounded-2xl border border-accent/20 bg-white/70 p-5">
                  <p className="flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent"><MapPin className="h-4 w-4" aria-hidden /> Location</p>
                  <p className="mt-1.5 font-heading text-[16px] font-bold text-primary">Brickfields, Kuala Lumpur</p>
                  <p className="font-body text-[13px] text-dark/65">5 minutes’ walk from KL Sentral / NU Sentral.</p>
                </div>
              </div>

              <h2 className="mt-8 font-heading text-[18px] font-bold text-primary">Why join us</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {VACANCY.perks.map((p) => (
                  <li key={p} className="flex gap-2.5 font-body text-[14.5px] text-dark/75"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden /> {p}</li>
                ))}
              </ul>

              <div className="mt-9 rounded-2xl bg-primary p-6 text-white">
                <h2 className="font-heading text-[20px] font-bold">How to apply</h2>
                <p className="mt-1.5 font-body text-[14.5px] text-white/80">Send your resume to <strong className="break-all">{VACANCY.applyEmail}</strong>.</p>
                <a href={applyMailto()} className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#C8102E] px-7 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#a60d26]">
                  <Mail className="h-4 w-4" aria-hidden /> Apply now: email your resume
                </a>
                <CopyEmailButton
                  email={VACANCY.applyEmail}
                  className="ml-3 mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/40 px-5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
                />
              </div>
            </div>

            <div>
              <Image
                src={VACANCY.poster}
                alt="We are hiring: Admin Assistant at Ayurvedic Wellness Centre. Basic salary RM2,500 to RM3,000 plus commissions. Send your resume to ayurvedicwellness2026@gmail.com."
                width={1100}
                height={1467}
                sizes="(max-width: 768px) 90vw, 360px"
                priority
                className="mx-auto w-full max-w-[360px] rounded-2xl border border-accent/20 shadow-lg md:sticky md:top-24"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
