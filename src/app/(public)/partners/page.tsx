import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, TrendingUp, ShieldCheck, HeartHandshake, ArrowRight, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Brand Partner Program — Ayurvedic Wellness Centre',
  description:
    'A curated affiliate program for wellness storytellers and TikTok creators in Malaysia. Earn meaningful commissions sharing authentic traditional Ayurveda with your audience.',
  alternates: { canonical: '/partners' },
  openGraph: {
    title: 'Brand Partner Program — Ayurvedic Wellness Centre',
    description:
      'Join a curated circle of wellness storytellers. Share authentic traditional Ayurveda. Earn meaningful commission. Apply by WhatsApp.',
    url: 'https://ayurvedawellness.com.my/partners',
    type: 'website',
  },
}

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Real commission, paid monthly',
    body:
      'Two commission models — straight affiliate percentage or wholesale reseller margin. We pick what suits your audience and channel.',
  },
  {
    icon: ShieldCheck,
    title: 'Curated, not crowded',
    body:
      'We onboard a small number of creators per quarter. Less competition for the same audience, more support per partner.',
  },
  {
    icon: HeartHandshake,
    title: 'Authentic product, easy to recommend',
    body:
      'Every formulation is overseen by our Vaidyas. No greenwashing, no copy-paste claims — just classical traditional Ayurveda.',
  },
]

export default function PartnersPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#12372D] text-white">
        {/* Layered gradients + grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 80% 0%, rgba(181, 138, 59,0.18), transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(20, 148, 71,0.18), transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B58A3B]/30 bg-[#B58A3B]/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#B58A3B]" />
            <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
              Brand Partner Program
            </span>
          </div>

          <h1
            className="font-heading text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            Share the medicine.
            <br />
            <span className="text-[#B58A3B]">Earn for the story.</span>
          </h1>

          <p
            className="mt-7 max-w-2xl font-body text-[15px] leading-[1.7] text-white/70 sm:text-base"
            style={{ lineHeight: 1.7 }}
          >
            A small, curated circle of TikTok creators and wellness storytellers helping us bring
            authentic traditional Ayurveda to households across Malaysia. If your audience trusts you on
            wellness, we&apos;d like to talk.
          </p>

          {/* Dual CTA */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href="https://wa.me/601163393436?text=Hi%20Ayurvedic%20Wellness%20Centre%2C%20I%27m%20interested%20in%20the%20Brand%20Partner%20program."
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#B58A3B] px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all duration-200 hover:bg-[#B58A3B] active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              Apply via WhatsApp
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/agent/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-heading text-sm font-semibold text-white/85 backdrop-blur-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              Sign in to Partner dashboard
            </Link>
          </div>

          <p className="mt-5 font-body text-[12px] text-white/45">
            Existing partners — use the email tied to your invitation. New applications are reviewed weekly by our team.
          </p>
        </div>
      </section>

      {/* ── Three pillars ──────────────────────────────────────────────── */}
      <section className="bg-[#EDF4E7]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#149447]">
              Why partner with us
            </span>
            <h2
              className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#12372D] sm:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Built for creators who care about what they recommend.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-[#12372D]/8 bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B58A3B]/40"
                style={{
                  boxShadow:
                    '0 1px 0 0 rgba(18, 55, 45,0.04), 0 12px 30px -16px rgba(18, 55, 45,0.18)',
                }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
                  <Icon className="h-5 w-5 text-[#149447]" strokeWidth={1.8} />
                </div>
                <h3
                  className="font-heading text-lg font-semibold text-[#12372D]"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2 font-body text-[14px] text-[#12372D]/70"
                  style={{ lineHeight: 1.7 }}
                >
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer band ────────────────────────────────────────────────── */}
      <section className="bg-[#12372D]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h3
            className="font-heading text-2xl font-bold text-white sm:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Curious if it&apos;s a fit?
          </h3>
          <p
            className="max-w-xl font-body text-[14px] text-white/65"
            style={{ lineHeight: 1.7 }}
          >
            Tell us about your audience and channel. We&apos;ll reply personally within one working day —
            no auto-responders, no forms inside forms.
          </p>
          <a
            href="https://wa.me/601163393436?text=Hi%20Ayurvedic%20Wellness%20Centre%2C%20I%27d%20like%20to%20learn%20more%20about%20the%20Brand%20Partner%20program."
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full bg-[#B58A3B] px-7 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-[#12372D] transition-all duration-200 hover:bg-[#B58A3B] active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            Start a Conversation
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>
    </>
  )
}
