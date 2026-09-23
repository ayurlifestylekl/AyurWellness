import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { mailtoLink, telLink, whatsappLink, CLINIC_ADDRESS, CLINIC_MAPS_URL, CLINIC_PHONE_PRIMARY } from '@/lib/clinic'

const quickLinks = [
  { label: 'Treatments',    href: '/treatments' },
  { label: 'Products',      href: '/products' },
  { label: 'Book Now',      href: '/book' },
  { label: 'Blog',          href: '/blog' },
  { label: 'My Account',    href: '/account/dashboard' },
]

const legalLinks = [
  { label: 'Privacy Policy',      href: '/privacy' },
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

            {/* Social placeholders until the brand's accounts are confirmed.
                Rendered inert rather than as href="#" links, so they can't be
                clicked into a dead navigation. */}
            <div className="mt-5 flex items-center gap-4">
              {/* Facebook */}
              <span
                aria-hidden
                title="Coming soon"
                className="text-white/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </span>
              {/* Instagram */}
              <span
                aria-hidden
                title="Coming soon"
                className="text-white/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </span>
              {/* TikTok */}
              <span
                aria-hidden
                title="Coming soon"
                className="text-white/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
              </span>
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
              <p className="font-semibold text-white/50">Ayurvedic Wellness Centre</p>
              <p>Reg. No: [BUSINESS REGISTRATION NO.] · Brickfields, Kuala Lumpur, Malaysia</p>
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
