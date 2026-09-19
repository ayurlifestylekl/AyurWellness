'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

import { EASE_OUT_PREMIUM, fadeUp, inViewOnce, staggerParent } from '@/lib/motion'
import { mailtoLink } from '@/lib/clinic'

type Channel = {
  serial: string
  kicker: string
  title: string
  description: string
  meta: string
  href: string
  external?: boolean
  pill?: string
}

const CHANNELS: Channel[] = [
  {
    serial: 'I',
    kicker: 'For treatment',
    title: 'Consult',
    description:
      'Begin with a consultation. Open every day, 10:00 AM — 8:00 PM, by appointment only.',
    meta: 'Same-day reply · Online booking',
    href: '/treatments#booking',
    pill: 'Booking',
  },
  {
    serial: 'II',
    kicker: 'For orders',
    title: 'Ayur-Store',
    description:
      'Bundles, refills and single herbs — couriered anywhere in Malaysia. Tracked by WhatsApp.',
    meta: 'Klang Valley 1–2d · East Malaysia 4–7d',
    href: '/contact?intent=product#letterhead',
    pill: 'Shipping',
  },
  {
    serial: 'III',
    kicker: 'For notes',
    title: 'General correspondence',
    description:
      'Every note read personally. Write to us about anything — we’re slow in all the right ways.',
    meta: 'Reply within one working day',
    href: '#letterhead',
  },
  {
    serial: 'IV',
    kicker: 'Editorial · Events · Corporate',
    title: 'Press & Partnerships',
    description:
      'Journalists, brand collaborators and corporate wellness programs — we reply to serious enquiries.',
    meta: 'Editorial · Events · Corporate wellness',
    href: mailtoLink('Press or Partnership Enquiry'),
    external: true,
  },
]

/**
 * Zone 2 — "The Switchboard"
 * Editorial 4-up spread. All channels visible at once on desktop, collapsed
 * to an accordion on mobile. Each channel cell anchors on a large gold italic
 * Roman numeral; content stack mirrors the original DetailPlate layout
 * (kicker → title → pill → flourish → description → dot-leader meta → link).
 */
export default function Directory() {
  const [mobileOpen, setMobileOpen] = useState<number | null>(0)

  return (
    <section
      aria-labelledby="directory-heading"
      className="relative overflow-hidden bg-cream py-14 sm:py-16 lg:py-20"
      id="directory"
    >
      {/* Atmospheric warm radials */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 12% 0%, rgba(181, 138, 59,0.10) 0%, transparent 55%), radial-gradient(ellipse 700px 500px at 88% 100%, rgba(0, 107, 60,0.06) 0%, transparent 60%)',
        }}
      />
      <div aria-hidden className="grain-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-8">
        {/* Section header */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <span
              aria-hidden
              className="h-px w-16 sm:w-24"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7))',
              }}
            />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
              The Switchboard
            </span>
            <span
              aria-hidden
              className="h-px w-16 sm:w-24"
              style={{
                background: 'linear-gradient(to left, transparent, rgba(181, 138, 59,0.7))',
              }}
            />
          </div>

          <h2
            id="directory-heading"
            className="mt-3 font-heading text-[26px] font-extrabold leading-[1.05] tracking-[-0.025em] text-primary sm:text-[32px]"
          >
            Four ways to{' '}
            <span className="font-body italic font-normal text-accent">reach us.</span>
          </h2>

          <p className="mx-auto mt-2.5 max-w-[44ch] font-body text-[13.5px] italic leading-[1.55] text-dark/70">
            Pick the channel that fits. Each one lands with a real person; none of them
            funnel into a queue.
          </p>
        </motion.div>

        {/* ─── DESKTOP — 4-up editorial spread ──────────────────── */}
        <motion.div
          variants={fadeUp(0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative mx-auto mt-10 hidden w-full rounded-[4px] bg-white/55 shadow-elevated lg:block"
        >
          {/* Outer double hairline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8px] rounded-[3px] border border-accent/30"
          />
          {/* L-bracket corner mitres */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[4px] top-[4px] h-3 w-3 border-l-2 border-t-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-[4px] top-[4px] h-3 w-3 border-r-2 border-t-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[4px] left-[4px] h-3 w-3 border-b-2 border-l-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[4px] right-[4px] h-3 w-3 border-b-2 border-r-2 border-accent/80"
          />

          {/* 4-up grid — 2×2 at lg, 4 columns at xl */}
          <motion.div
            variants={staggerParent(0.08, 0.15)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="relative grid grid-cols-2 divide-accent/20 xl:grid-cols-4 [&>*:nth-child(2n)]:border-l [&>*:nth-child(2n)]:border-accent/20 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-accent/20 xl:[&>*:nth-child(2n)]:border-l-0 xl:[&>*:nth-child(n+3)]:border-t-0 xl:[&>*+*]:border-l xl:[&>*+*]:border-accent/20"
          >
            {CHANNELS.map((channel) => (
              <ChannelCell key={channel.serial} channel={channel} />
            ))}
          </motion.div>
        </motion.div>

        {/* ─── MOBILE — inline accordion ──────────────────────────── */}
        <motion.div
          variants={fadeUp(0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative mx-auto mt-8 w-full rounded-[4px] bg-white/60 shadow-elevated lg:hidden"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[8px] rounded-[3px] border border-accent/30"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[4px] top-[4px] h-3 w-3 border-l-2 border-t-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-[4px] top-[4px] h-3 w-3 border-r-2 border-t-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[4px] left-[4px] h-3 w-3 border-b-2 border-l-2 border-accent/80"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[4px] right-[4px] h-3 w-3 border-b-2 border-r-2 border-accent/80"
          />
          <ul className="flex flex-col p-4 sm:p-5">
            {CHANNELS.map((c, idx) => (
              <MobileAccordionRow
                key={c.serial}
                channel={c}
                index={idx}
                isOpen={mobileOpen === idx}
                onToggle={() => setMobileOpen(mobileOpen === idx ? null : idx)}
              />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── */

function ChannelCell({ channel }: { channel: Channel }) {
  const numeralSize = channel.serial.length >= 3 ? '54px' : '64px'

  return (
    <motion.div
      variants={fadeUp(0)}
      className="group relative flex flex-col p-7 xl:p-8"
    >
      {/* Header row — N° + numeral, then label stack */}
      <div className="flex items-start gap-5">
        <span className="flex shrink-0 flex-col items-start leading-none">
          <span className="font-body text-[10px] italic text-accent/65">N°</span>
          <span
            className="mt-0.5 font-body italic leading-none text-accent transition-colors duration-300 group-hover:text-primary"
            style={{
              fontSize: numeralSize,
              letterSpacing: '-0.03em',
            }}
          >
            {channel.serial}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.28em] text-primary/55">
            {channel.kicker}
          </span>
          <h3
            className="mt-1 font-body italic text-primary"
            style={{
              fontSize: 'clamp(20px, 1.7vw, 24px)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
            }}
          >
            {channel.title}
            <span className="text-accent">.</span>
          </h3>
          {channel.pill && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.08] px-2.5 py-1 font-heading text-[8.5px] font-semibold uppercase tracking-[0.22em] text-accent">
              <span aria-hidden>◊</span>
              {channel.pill}
            </span>
          )}
        </div>
      </div>

      {/* Gold flourish */}
      <span
        aria-hidden
        className="mt-4 block h-px w-20"
        style={{
          background:
            'linear-gradient(to right, rgba(181, 138, 59,0.85), rgba(181, 138, 59,0.15))',
        }}
      />

      {/* Description */}
      <p className="mt-4 font-body text-[13px] leading-[1.65] text-dark/80">
        {channel.description}
      </p>

      {/* Dot-leader meta */}
      <div className="mt-4 flex items-baseline gap-3">
        <span aria-hidden className="h-px w-10 border-t border-dotted border-primary/40" />
        <span className="font-body text-[11.5px] italic text-primary/75">
          {channel.meta}
        </span>
      </div>

      {/* Spacer — push CTA to bottom of cell */}
      <div className="flex-1" />

      {/* CTA — editorial text link */}
      <div className="mt-6">
        <BeginLink channel={channel} />
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────── */

function BeginLink({ channel }: { channel: Channel }) {
  const cls =
    'group/link inline-flex items-center gap-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.28em] text-accent transition-colors duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream'
  const arrow = (
    <ArrowRight
      className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1"
      strokeWidth={2.5}
    />
  )

  if (channel.external) {
    return (
      <a href={channel.href} className={cls}>
        Begin
        {arrow}
      </a>
    )
  }

  return (
    <Link href={channel.href} className={cls}>
      Begin
      {arrow}
    </Link>
  )
}

function BeginButton({ channel }: { channel: Channel }) {
  const cls =
    'inline-flex w-fit items-center gap-3 rounded-[2px] border border-accent/60 bg-accent px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.28em] text-white shadow-[0_10px_24px_-12px_rgba(181, 138, 59,0.9)] transition-colors duration-300 hover:bg-primary hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream'

  if (channel.external) {
    return (
      <a href={channel.href} className={cls}>
        Begin
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </a>
    )
  }

  return (
    <Link href={channel.href} className={cls}>
      Begin
      <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────── */

function MobileAccordionRow({
  channel,
  index,
  isOpen,
  onToggle,
}: {
  channel: Channel
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const isLast = index === CHANNELS.length - 1

  return (
    <li className={isLast ? '' : 'border-b border-accent/15'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <span
          aria-hidden
          className="font-body italic leading-none text-accent"
          style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
        >
          {channel.serial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.26em] text-primary/55">
            {channel.kicker}
          </span>
          <span className="truncate font-heading text-[14.5px] font-semibold text-primary">
            {channel.title}
          </span>
        </span>
        <motion.span
          aria-hidden
          className="shrink-0 text-accent"
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_PREMIUM }}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_PREMIUM }}
            className="overflow-hidden"
          >
            <div className="pb-5 pl-[38px] pr-1">
              {channel.pill && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.08] px-2 py-0.5 font-heading text-[8.5px] font-semibold uppercase tracking-[0.22em] text-accent">
                  <span aria-hidden>◊</span>
                  {channel.pill}
                </span>
              )}
              <p className="mt-2 font-body text-[13px] leading-[1.6] text-dark/80">
                {channel.description}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="h-px w-8 border-t border-dotted border-primary/40"
                />
                <span className="font-body text-[11.5px] italic text-primary/70">
                  {channel.meta}
                </span>
              </div>
              <div className="mt-4">
                <BeginButton channel={channel} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
