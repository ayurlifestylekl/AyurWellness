import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { mailtoLink, telLink, whatsappLink, CLINIC_ADDRESS, CLINIC_MAPS_URL, CLINIC_PHONE_PRIMARY, CLINIC_LEGAL_NAME, CLINIC_REG_NO, CLINIC_SOCIALS } from '@/lib/clinic'
import { SOCIAL_ICON } from '@/components/ui/socialIcons'

const quickLinks = [
  { label: 'Treatments',    href: '/treatments' },
  { label: 'Products',      href: '/products' },
  { label: 'Book Now',      href: '/book' },
  { label: 'Blog',          href: '/blog' },
  { label: 'My Account',    href: '/account/dashboard' },
]

const legalLinks = [
  { label: 'Privacy Notice',      href: '/privacy' },
  { label: 'Terms of Service',    href: '/terms' },
  { label: 'Cancellation Policy', href: '/cancellation' },
]

export default function Footer() {
  return (
    <footer className="bg-[#12372D] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-10">

          {/* ── Brand Column ── */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <Link
              href="/"
              aria-label="Ayurvedic Wellness Centre — home"
              className="mb-4 inline-flex items-center gap-2.5"
            >
              <Image
                src="/awc-icon.png"
                alt=""
                width={1090}
                height={890}
                className="h-11 w-auto rounded-lg bg-white p-1.5"
              />
              <span className="font-heading text-[15px] font-extrabold leading-tight text-white">
                Ayurvedic Wellness<br /> Centre
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed text-white/60">
              Authentic traditional Ayurveda therapies in Brickfields, Kuala Lumpur — delivering holistic healing rooted in tradition.
            </p>

            <div className="mt-5 flex items-center gap-4">
              {CLINIC_SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="-m-2 inline-flex h-10 w-10 items-center justify-center text-white/50 transition-colors hover:text-accent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d={SOCIAL_ICON[s.name]} />
                  </svg>
                </a>
              ))}
              <a
                href={mailtoLink()}
                aria-label="Email"
                className="-m-2 inline-flex h-10 w-10 items-center justify-center text-white/50 transition-colors hover:text-accent"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-white/40">
              Quick Links
            </h3>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[40px] items-center font-body text-sm text-white/60 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact ── */}
          <div className="lg:col-span-4">
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-white/40">
              Contact
            </h3>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-5 font-body text-sm text-white/60 sm:grid-cols-2">
              <li>
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Location</span>
                <a
                  href={CLINIC_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block leading-relaxed transition-colors hover:text-accent"
                >
                  Ayurvedic Wellness Centre<br />
                  {CLINIC_ADDRESS}
                </a>
              </li>

              <li>
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Call or WhatsApp</span>
                <div className="flex flex-col">
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center transition-colors hover:text-accent"
                  >
                    +6011-6339 3436{' '}
                    <span className="text-white/40">&nbsp;(WhatsApp)</span>
                  </a>
                  <a
                    href={telLink()}
                    className="inline-flex min-h-[40px] items-center transition-colors hover:text-accent"
                  >
                    {CLINIC_PHONE_PRIMARY}
                  </a>
                </div>
              </li>

              <li>
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Business Hours</span>
                <span className="block leading-relaxed">
                  9:00 AM – 9:00 PM<br />
                  <span className="text-[12px] italic text-white/45">Daily · Public holidays included</span>
                </span>
              </li>

              <li>
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">Consultation Hours</span>
                <span className="block leading-relaxed">
                  10:00 AM – 8:00 PM<br />
                  <span className="text-[12px] italic text-white/45">Daily · Public holidays included</span>
                </span>
              </li>
            </ul>
          </div>

          {/* ── Book CTA ── */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-white/40">
              Book a Session
            </h3>
            <p className="mb-5 font-body text-sm text-white/60">
              Experience authentic Ayurvedic healing. All bookings are with our professional Vaidyas.
            </p>
            <Link
              href="/book/consultation"
              className="inline-block rounded-full bg-accent px-6 py-2.5 font-heading text-sm font-semibold text-dark shadow transition-all hover:brightness-110"
            >
              Book Consultation
            </Link>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Legal entity */}
            <div className="font-body text-xs text-white/30">
              <p className="font-semibold text-white/50">{CLINIC_LEGAL_NAME}</p>
              <p>Reg. No: {CLINIC_REG_NO} · Brickfields, Kuala Lumpur, Malaysia</p>
            </div>

            {/* Legal links + copyright */}
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[40px] items-center font-body text-xs text-white/30 transition-colors hover:text-white/60"
                >
                  {link.label}
                </Link>
              ))}
              <span className="font-body text-xs text-white/20">
                © {new Date().getFullYear()} Ayurvedic Wellness Centre
              </span>
            </div>
          </div>

          {/* Agency credit */}
          <p className="mt-6 text-center font-body text-[11px] tracking-wide text-white/25">
            Designed &amp; developed by{' '}
            <a
              href="mailto:aurexissolution@gmail.com"
              className="font-semibold text-white/40 transition-colors hover:text-accent"
            >
              Aurexis Solution
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
