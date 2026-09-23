'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingCart, User, ChevronRight, Phone, Mail, MapPin, Calendar, Sparkles } from 'lucide-react'
import { COMMERCE_ENABLED } from '@/lib/admin/features'
import { CLINIC_ADDRESS, CLINIC_EMAIL, CLINIC_MAPS_URL, CLINIC_PHONE_PRIMARY, mailtoLink, telLink } from '@/lib/clinic'

const navLinks = [
  { label: 'Home',        href: '/'           },
  { label: 'About Us',    href: '/about'      },
  { label: 'Treatments',  href: '/treatments' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]               = useState(false)
  const [accountDropdownOpen, setAccountDropdown] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const linkCls = (href: string) => {
    const active = pathname === href
    return [
      'border-b-2 py-1 font-heading text-[12.5px] font-semibold uppercase tracking-wide transition-colors duration-200 whitespace-nowrap',
      active
        ? 'border-accent text-accent'
        : 'border-transparent text-dark/75 hover:text-accent',
    ].join(' ')
  }

  return (
    <header className="sticky top-0 z-40 w-full">

      {/* ── Top Info Bar ── */}
      <div className="bg-[#12372D] border-b border-[#B58A3B]/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">

          {/* Left: contact */}
          <div className="hidden items-center gap-5 lg:flex">
            <a href={CLINIC_MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-[#B58A3B]">
              <MapPin className="h-3 w-3 shrink-0 text-[#B58A3B]" />
              {CLINIC_ADDRESS}
            </a>
            <span className="h-3 w-px bg-white/10" />
            <a href={telLink(CLINIC_PHONE_PRIMARY)} className="flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-[#B58A3B]">
              <Phone className="h-3 w-3 text-[#B58A3B]" />
              {CLINIC_PHONE_PRIMARY}
            </a>
            <span className="h-3 w-px bg-white/10" />
            <a href={mailtoLink()} className="flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-[#B58A3B]">
              <Mail className="h-3 w-3 text-[#B58A3B]" />
              {CLINIC_EMAIL}
            </a>
          </div>
          <p className="truncate text-xs text-white/40 lg:hidden">Ayurvedic Wellness Centre</p>

          {/* Right: social */}
          <div className="flex items-center gap-2">
            {/* Placeholders until the brand's social accounts are confirmed.
                Rendered inert rather than as href="#" links, so they can't be
                clicked into a dead navigation. */}
            <span aria-hidden title="Coming soon" className="flex h-6 w-6 items-center justify-center text-white/30">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </span>
            <span aria-hidden title="Coming soon" className="flex h-6 w-6 items-center justify-center text-white/30">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Navbar — clean ivory bar, plain links, single green CTA ── */}
      <div className="bg-background shadow-sm shadow-black/5">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">

          {/* ── Logo ── */}
          <Link
            href="/"
            aria-label="Ayurvedic Wellness Centre — home"
            className="group flex shrink-0 items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/awc-icon.png"
              alt=""
              width={1090}
              height={890}
              priority
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-9"
            />
            <span className="flex flex-col">
              <span className="hidden font-heading text-[8px] font-semibold uppercase tracking-[0.2em] text-secondary sm:block">
                Wellness · Heritage · Harmony
              </span>
              <span className="font-heading text-[14px] font-extrabold leading-tight text-primary sm:text-[15px]">
                Ayurvedic Wellness Centre
              </span>
            </span>
          </Link>

          {/* ── Desktop: plain nav links directly on the ivory bar ── */}
          <div className="hidden items-center gap-5 lg:flex xl:gap-6">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
            ))}

            <Link href="/products" className={linkCls('/products')}>Products</Link>

            <Link href="/blog" className={linkCls('/blog')}>Blog</Link>
            <Link href="/contact" className={linkCls('/contact')}>Contact</Link>
          </div>

          {/* ── Right: Book Consultation CTA + Cart/Account icons ── */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <Link
              href="/book"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_10px_24px_-10px_rgba(0,107,60,0.55)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 whitespace-nowrap"
            >
              <Calendar className="h-3.5 w-3.5" />
              Book Consultation
            </Link>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="flex h-8 w-8 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/8 hover:text-primary">
              <ShoppingCart className="h-4 w-4" />
            </Link>

            {/* User pill — dropdown */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                type="button"
                onClick={() => setAccountDropdown((p) => !p)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountDropdownOpen}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/8 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <User className="h-4 w-4" />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-[336px] origin-top-right">
                  <div
                    className="relative overflow-hidden rounded-[28px] border border-[#B58A3B]/25 bg-gradient-to-b from-[#12372D] via-[#12372D] to-[#12372D]"
                    style={{
                      boxShadow:
                        '0 24px 60px -18px rgba(0,0,0,0.55), 0 8px 20px -10px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Grain overlay for depth */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6' /></svg>\")",
                      }}
                    />

                    {/* Eyebrow rule */}
                    <div className="relative flex items-center gap-3 px-6 pt-5 pb-3">
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#B58A3B]/40" />
                      <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-[#B58A3B]/85">
                        Sign in as
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#B58A3B]/40" />
                    </div>

                    {/* Item 1 — Wellness Member */}
                    <Link
                      href="/auth/login"
                      onClick={() => setAccountDropdown(false)}
                      className="group relative flex items-center gap-4 border-b border-white/[0.06] px-6 py-4 transition-colors duration-200 hover:bg-white/[0.035]"
                    >
                      <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-[#B58A3B] transition-[height] duration-300 group-hover:h-9" />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#B58A3B]/30 bg-[#B58A3B]/[0.06] transition-colors duration-200 group-hover:border-[#B58A3B]/55 group-hover:bg-[#B58A3B]/[0.14]">
                        <User className="h-[18px] w-[18px] text-[#B58A3B]" strokeWidth={1.6} />
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span
                          className="font-heading text-[14px] font-semibold text-white"
                          style={{ letterSpacing: '-0.005em' }}
                        >
                          Wellness Member
                        </span>
                        <span
                          className="font-body text-[11.5px] text-white/55"
                          style={{ lineHeight: 1.55 }}
                        >
                          Track orders & consultations
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 -translate-x-2 text-[#B58A3B]/0 transition-[transform,color] duration-300 group-hover:translate-x-0 group-hover:text-[#B58A3B]/85"
                        strokeWidth={2}
                      />
                    </Link>

                    {/* Item 2 — Brand Partner (archived until the affiliate program launches) */}
                    {COMMERCE_ENABLED && (
                    <Link
                      href="/partners"
                      onClick={() => setAccountDropdown(false)}
                      className="group relative flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-white/[0.035]"
                    >
                      <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-[#B58A3B] transition-[height] duration-300 group-hover:h-9" />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#B58A3B]/30 bg-[#B58A3B]/[0.06] transition-colors duration-200 group-hover:border-[#B58A3B]/55 group-hover:bg-[#B58A3B]/[0.14]">
                        <Sparkles className="h-[18px] w-[18px] text-[#B58A3B]" strokeWidth={1.6} />
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span
                          className="font-heading text-[14px] font-semibold text-white"
                          style={{ letterSpacing: '-0.005em' }}
                        >
                          Brand Partner
                        </span>
                        <span
                          className="font-body text-[11.5px] text-white/55"
                          style={{ lineHeight: 1.55 }}
                        >
                          Affiliate program for creators
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 -translate-x-2 text-[#B58A3B]/0 transition-[transform,color] duration-300 group-hover:translate-x-0 group-hover:text-[#B58A3B]/85"
                        strokeWidth={2}
                      />
                    </Link>
                    )}

                    {/* Footer mark */}
                    <div className="relative border-t border-white/[0.06] px-6 py-2.5 text-center">
                      <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.32em] text-white/30">
                        Ayurvedic Wellness Centre
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile: hamburger ── */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/cart" aria-label="Cart" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12372D]/8 text-[#12372D] hover:bg-[#12372D]/15">
              <ShoppingCart className="h-4.5 w-4.5" />
            </Link>
            <button
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12372D] text-white"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="bg-[#12372D] lg:hidden">
          <ul className="flex flex-col px-4 py-3">

            <li className="border-b border-white/8">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                Home
              </Link>
            </li>
            <li className="border-b border-white/8">
              <Link href="/about" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                About Us
              </Link>
            </li>
            <li className="border-b border-white/8">
              <Link href="/treatments" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                Treatments
              </Link>
            </li>

            <li className="border-b border-white/8">
              <Link href="/products" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                Products
              </Link>
            </li>

            <li className="border-b border-white/8">
              <Link href="/blog" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                Blog
              </Link>
            </li>
            <li className="border-b border-white/8">
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="block py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white/75 transition-colors hover:text-[#B58A3B]">
                Contact
              </Link>
            </li>

            {/* CTA stack */}
            <li className="mt-4 space-y-2 pb-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 font-heading text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                <User className="h-4 w-4" />
                Wellness Member
              </Link>
              <Link
                href="/partners"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 font-heading text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                Brand Partner
              </Link>
              <Link
                href="/book"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-heading text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-110"
              >
                <Calendar className="h-4 w-4" />
                Book Consultation
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
