'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { EASE_OUT_PREMIUM, fadeUp, inViewOnce, staggerParent } from '@/lib/motion'
import { CLINIC_EMAIL, CLINIC_PHONE_PRIMARY, mailtoLink, telLink, whatsappLink } from '@/lib/clinic'

const heroDiamondPattern = {
  backgroundImage: `
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px),
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 14px 14px',
}

const HOURS: Array<{ label: string; value: string; rest?: boolean }> = [
  { label: 'Business hours', value: '09:00 — 21:00' },
  { label: 'Consultation hours', value: '10:00 — 20:00' },
]

/**
 * Zone 5 — "The Bureau"
 * Dark counterpart to the Threshold hero. Three-column frieze: live Google
 * Map · engraved dot-leader timetable · address plaque with stacked action
 * buttons. Vertical gold hairlines between columns with diamond midpoints
 * (About's Colonnade grammar, repurposed with live media).
 */
export default function Bureau() {
  return (
    <section
      id="bureau"
      aria-labelledby="bureau-heading"
      className="relative flex min-h-[calc(100svh-6.5rem)] items-center overflow-hidden bg-primary"
    >
      {/* L0  Gold dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={heroDiamondPattern}
        aria-hidden
      />

      {/* L1  Warm atmospheric radials (shifted from Threshold so the two
              dark zones feel related but not identical) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 15% 5%, rgba(181, 138, 59,0.18) 0%, transparent 55%), radial-gradient(ellipse 800px 650px at 92% 100%, rgba(18, 55, 45,0.6) 0%, transparent 55%)',
        }}
        aria-hidden
      />

      {/* L3  Grain */}
      <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />

      {/* L4  Gold double frame + corner brackets */}
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={inViewOnce}
        transition={{ duration: 1.2, ease: EASE_OUT_PREMIUM }}
        className="pointer-events-none absolute inset-4 sm:inset-6 md:inset-8 lg:inset-10"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-[2px] border border-accent/55" />
        <div className="absolute inset-[10px] rounded-[2px] border border-accent/25 sm:inset-3" />
        <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l-2 border-t-2 border-accent/80" />
        <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r-2 border-t-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-accent/80" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-10">
        {/* Masthead */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <span
              aria-hidden
              className="h-px w-16 sm:w-24"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(181, 138, 59,0.75))',
              }}
            />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.42em] text-accent/85">
              Vol. II · The Bureau
            </span>
            <span
              aria-hidden
              className="h-px w-16 sm:w-24"
              style={{
                background: 'linear-gradient(to left, transparent, rgba(181, 138, 59,0.75))',
              }}
            />
          </div>

          <h2
            id="bureau-heading"
            className="mt-3 font-heading font-extrabold leading-[1] text-white"
            style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', letterSpacing: '-0.025em' }}
          >
            Find us at{' '}
            <span className="font-body italic font-normal text-accent">
              Brickfields.
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-[52ch] font-body italic leading-[1.55] text-white/65"
            style={{ fontSize: '14px' }}
          >
            A quiet shop-lot in the Little India quarter — between the temple
            incense and the curry houses. Step through the teak door; the Centre
            is on the ground floor.
          </p>
        </motion.div>

        {/* Three-column frieze */}
        <motion.div
          variants={staggerParent(0.1, 0.2)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-0"
        >
          {/* Vertical gold hairlines between columns (desktop) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%/(1.1+1+1)*1.1)] top-10 hidden h-[calc(100%-80px)] w-px lg:block"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.45) 12%, rgba(181, 138, 59,0.45) 88%, transparent)',
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%/(1.1+1+1)*(1.1+1))] top-10 hidden h-[calc(100%-80px)] w-px lg:block"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.45) 12%, rgba(181, 138, 59,0.45) 88%, transparent)',
            }}
          />
          {/* Diamond midpoints */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%/(1.1+1+1)*1.1)] top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent/90 shadow-[0_0_0_4px_rgba(181, 138, 59,0.15)] lg:block"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%/(1.1+1+1)*(1.1+1))] top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent/90 shadow-[0_0_0_4px_rgba(181, 138, 59,0.15)] lg:block"
          />

          {/* ─── Column 1 · The Map ───────────────────── */}
          <motion.div variants={fadeUp(0)} className="relative lg:pr-12">
            <ColumnHeader index="01" label="The Map" />
            <div
              className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-[2px] ring-1 ring-accent/40 lg:aspect-square"
              style={{
                boxShadow:
                  '0 30px 60px -24px rgba(0,0,0,0.55), 0 10px 30px -10px rgba(181, 138, 59,0.2)',
              }}
            >
              <iframe
                title="Ayurvedic Wellness Centre · Brickfields"
                src="https://www.google.com/maps?q=3.1269091,101.6812077&z=16&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                style={{ filter: 'saturate(0.75) contrast(1.05)' }}
              />
              {/* Gold foil inner frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2 border border-accent/60"
              />
              {/* Corner mitres */}
              <div className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-accent" />
              <div className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-accent" />
              <div className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-accent" />
              <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-accent" />
              {/* Plate badge */}
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-accent/95 px-2.5 py-1 font-body text-[10px] italic text-primary shadow-[0_10px_24px_-10px_rgba(181, 138, 59,0.8)]">
                <span aria-hidden className="inline-block h-1 w-1 rotate-45 bg-primary/70" />
                N°01 · Brickfields
              </span>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=3.1269091,101.6812077"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 border-b border-accent/50 pb-0.5 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-accent/90 transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              <MapPin className="h-3 w-3" strokeWidth={2.2} />
              Open in Google Maps →
            </a>
          </motion.div>

          {/* ─── Column 2 · The Timetable ─────────────── */}
          <motion.div variants={fadeUp(0)} className="relative lg:px-12">
            <ColumnHeader index="02" label="The Timetable" />
            <div className="mt-3 flex flex-col gap-3">
              {/* Top hairline */}
              <span
                aria-hidden
                className="h-px w-full"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(181, 138, 59,0.65) 10%, rgba(181, 138, 59,0.65) 90%, transparent)',
                }}
              />

              <dl className="flex flex-col gap-2">
                {HOURS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline gap-3"
                  >
                    <dt className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                      {row.label}
                    </dt>
                    <span
                      aria-hidden
                      className="mb-1 flex-1 border-b border-dotted border-accent/35"
                    />
                    <dd
                      className="font-body text-[14px] italic text-accent/95"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Bottom hairline */}
              <span
                aria-hidden
                className="h-px w-full"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(181, 138, 59,0.65) 10%, rgba(181, 138, 59,0.65) 90%, transparent)',
                }}
              />

              <p className="font-body text-[13px] italic leading-[1.6] text-white/55">
                Open every day — Monday through Sunday, including public holidays.
                Consultations by appointment within the consultation window;
                Ayur-Store walk-ins welcome any time during business hours.
              </p>

              {/* Live clock block */}
              <div className="mt-3 rounded-[2px] border-l-2 border-accent/60 bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
                <p className="font-heading text-[9px] font-bold uppercase tracking-[0.3em] text-accent/80">
                  Right now in Brickfields
                </p>
                <LiveClock />
              </div>
            </div>
          </motion.div>

          {/* ─── Column 3 · The Plaque ────────────────── */}
          <motion.div variants={fadeUp(0)} className="relative lg:pl-12">
            <ColumnHeader index="03" label="The Plaque" />
            <div className="mt-3 flex flex-col gap-2">
              {/* Plaque block */}
              <div className="relative rounded-[2px] border border-accent/30 bg-white/[0.02] px-4 py-3.5 backdrop-blur-sm">
                {/* Gold seal dot */}
                <span
                  aria-hidden
                  className="absolute right-4 top-4 h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(181, 138, 59,0.2)]"
                />
                <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
                  Ayurvedic Wellness Centre
                </p>
                <p className="mt-2 font-body text-[14px] italic leading-[1.55] text-accent/90">
                  No. 37, Jalan Thamby Abdullah-1 · 50470
                </p>
                <p className="mt-1 font-body text-[13.5px] italic leading-[1.55] text-white/55">
                  Brickfields, Kuala Lumpur, Malaysia
                </p>

                <span
                  aria-hidden
                  className="mt-5 block h-px w-20"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(181, 138, 59,0.85), rgba(181, 138, 59,0.15))',
                  }}
                />

                <p className="mt-2 font-heading text-[9.5px] font-semibold uppercase tracking-[0.26em] text-white/45">
                  Close to DBKL Sports &amp; Recreation Centre
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {/* Primary phone */}
                <div className="rounded-[2px] border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors duration-300 hover:border-accent/40">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                      <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-[9px] font-bold uppercase tracking-[0.26em] text-white/55">
                        Call the Centre
                      </p>
                      <a
                        href={telLink()}
                        className="mt-1 block font-body text-[13.5px] italic leading-[1.35] text-accent/95 transition-colors duration-200 hover:text-accent"
                      >
                        {CLINIC_PHONE_PRIMARY}
                      </a>
                    </div>
                  </div>
                </div>

                <ActionLink
                  href={whatsappLink()}
                  external
                  icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                  label="WhatsApp"
                  value="+6011-6339 3436 · fastest"
                />
                <ActionLink
                  href={mailtoLink()}
                  icon={<Mail className="h-3.5 w-3.5" strokeWidth={2} />}
                  label="Email"
                  value={CLINIC_EMAIL}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ColumnHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-body italic leading-none text-accent/75"
        style={{ fontSize: '32px', letterSpacing: '-0.02em' }}
      >
        {index}
      </span>
      <span
        aria-hidden
        className="h-px w-8"
        style={{
          background: 'linear-gradient(to right, rgba(181, 138, 59,0.8), rgba(181, 138, 59,0.15))',
        }}
      />
      <span className="font-heading text-[10.5px] font-bold uppercase tracking-[0.3em] text-white/85">
        {label}
      </span>
    </div>
  )
}

function ActionLink({
  href,
  external,
  icon,
  label,
  value,
}: {
  href: string
  external?: boolean
  icon: React.ReactNode
  label: string
  value: string
}) {
  const extraProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {}
  return (
    <a
      href={href}
      {...extraProps}
      className="group flex items-center justify-between gap-4 rounded-[2px] border border-white/10 bg-white/[0.03] px-3.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent/20">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-[9.5px] font-bold uppercase tracking-[0.22em] text-white/55">
            {label}
          </p>
          <p className="mt-0.5 truncate font-body text-[13.5px] italic text-white/90">
            {value}
          </p>
        </div>
      </div>
      <span
        aria-hidden
        className="font-body text-[16px] italic text-accent/0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent/80"
      >
        →
      </span>
    </a>
  )
}

/**
 * Minimal live clock — mounts client-side and ticks every 30s. Shows
 * Asia/Kuala_Lumpur time as HH:mm · Weekday.
 */
function LiveClock() {
  const [parts, setParts] = React.useState<{ time: string; day: string } | null>(null)

  React.useEffect(() => {
    const build = () => {
      const now = new Date()
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now)
      const day = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'long',
      }).format(now)
      setParts({ time, day })
    }
    build()
    const id = window.setInterval(build, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const time = parts?.time ?? '--:--'
  const day = parts?.day ?? ''

  return (
    <div className="mt-2 flex items-baseline gap-3">
      <span
        className="font-heading font-extrabold leading-none tracking-[-0.02em] text-white"
        style={{ fontSize: '36px', fontVariantNumeric: 'tabular-nums' }}
      >
        {time}
      </span>
      <span className="font-body text-[13px] italic text-accent/80">MYT</span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-accent/60" />
      <span className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
        {day || '\u00A0'}
      </span>
    </div>
  )
}
