'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

/* ── Minimal-luxury layout, harmonized to the homepage palette ── */
const GOLD = '#B58A3B' // brand gold — minor decorative accents only
const LOTUS = '#B8752A' // main accent — highlighted words, links
const INK = '#006B3C' // brand forest green

/* Generated paper texture (no photo) */
const PAPER_MOTTLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E\")"
const PAPER_TOOTH =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")"

type Category = {
  slug: string
  name: string
  tagline: string
  durationMin: number
  image: string
  href: string
}

const categories: Category[] = [
  {
    slug: 'spine-joint',
    name: 'Spine & Joint',
    tagline: 'Restore mobility',
    durationMin: 60,
    image: '/therapies/spine-joint.jpg',
    href: '/treatments/joint-care-therapies',
  },
  {
    slug: 'hair-skin',
    name: 'Hair & Skin',
    tagline: 'Glow from within',
    durationMin: 50,
    image: '/therapies/hair-skin.jpg',
    href: '/treatments/hair-scalp-care-therapies',
  },
  {
    slug: 'post-delivery',
    name: 'Post-Delivery',
    tagline: 'For new mothers',
    durationMin: 75,
    image: '/therapies/post-delivery.jpg',
    href: '/treatments/post-delivery-care-sutika-paricharya',
  },
  {
    slug: 'de-stress',
    name: 'De-Stress',
    tagline: 'Quiet the mind',
    durationMin: 45,
    image: '/therapies/de-stress.jpg',
    href: '/treatments/stress-relieving-sleep',
  },
  {
    slug: 'panchakarma',
    name: 'Panchakarma',
    tagline: 'Five-stage detox',
    durationMin: 90,
    image: '/therapies/panchakarma.jpg',
    href: '/treatments/panchakarma',
  },
]

/**
 * Signature Therapies — quiet minimal-luxury.
 * Solid warm-bone paper (generated grain, no photo) framed by soft watercolor
 * leaf corners, with a calm five-up gallery carried by typography and space.
 */
export default function ClinicTherapies() {
  return (
    <section
      id="clinic-therapies"
      aria-labelledby="therapies-heading"
      className="relative overflow-hidden"
      style={{ background: '#FFF9F2' }}
    >
      {/* soft sheet of light from the top — gentle dimension */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(95% 60% at 50% -12%, rgba(255,249,242,0.75), transparent 62%)',
        }}
      />
      {/* handmade-paper tonal mottle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.09, mixBlendMode: 'multiply', backgroundImage: PAPER_MOTTLE, backgroundSize: '640px 640px' }}
      />
      {/* fine paper tooth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.12, mixBlendMode: 'multiply', backgroundImage: PAPER_TOOTH, backgroundSize: '180px 180px' }}
      />

      {/* watercolor leaf corners — single asset windowed to each corner, white blended out */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[100px] w-[120px] bg-[url('/leaves.jpg')] bg-[length:260px_auto] bg-right-top bg-no-repeat opacity-[0.88] mix-blend-multiply sm:h-[160px] sm:w-[190px] sm:bg-[length:430px_auto]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 hidden h-[190px] w-[210px] bg-[url('/leaves.jpg')] bg-[length:430px_auto] bg-left-bottom bg-no-repeat opacity-[0.88] mix-blend-multiply sm:block"
      />

      {/* single hairline at the top */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(42,42,40,0.10)' }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-7 py-8 sm:px-10 lg:px-12 lg:py-10">
        {/* ── Header — editorial, lots of air ── */}
        <motion.header
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-xl">
            <span className="font-heading text-[10px] font-medium uppercase tracking-[0.42em]" style={{ color: GOLD }}>
              At the Centre
            </span>
            <h2
              id="therapies-heading"
              className="mt-2 font-display"
              style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', lineHeight: 1.04, color: INK, fontWeight: 400 }}
            >
              Signature <span className="italic" style={{ color: LOTUS, textShadow: '0 3px 22px rgba(184,117,42,0.18)' }}>therapies</span>
            </h2>
            <p className="mt-2 max-w-md font-body text-[13px] font-light leading-[1.6]" style={{ color: 'rgba(42,42,40,0.62)' }}>
              Tailored to your dosha and performed by our experienced therapists — a small, considered collection.
            </p>
          </div>

          <Link
            href="/treatments"
            className="group inline-flex items-center gap-2 self-start pb-1 font-heading text-[11px] font-medium uppercase tracking-[0.24em] sm:self-end"
            style={{ color: LOTUS }}
          >
            <span className="relative">
              View all therapies
              <span className="absolute -bottom-1 left-0 h-px w-0 transition-[width] duration-500 group-hover:w-full" style={{ background: LOTUS }} />
            </span>
            <span className="opacity-60 transition-transform duration-300 group-hover:translate-x-1" style={{ color: LOTUS }}>→</span>
          </Link>
        </motion.header>

        {/* ── The collection — bento mosaic, text lives on the photo ── */}
        <motion.ol
          variants={staggerParent(0.06, 0.12)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-6 grid grid-cols-2 grid-rows-3 gap-3 sm:grid-cols-4 sm:grid-rows-2 lg:mt-7 lg:gap-4"
        >
          {(() => {
            const feature = categories[categories.length - 1]
            const rest = categories.slice(0, categories.length - 1)
            const ordered = [feature, ...rest]
            return ordered.map((cat, i) => {
              const isFeature = i === 0
              return (
                <motion.li
                  key={cat.slug}
                  variants={fadeUp(0)}
                  className={
                    isFeature
                      ? 'group relative col-span-2 row-span-1 aspect-[16/9] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto'
                      : 'group relative col-span-1 row-span-1 aspect-[4/3] overflow-hidden rounded-2xl'
                  }
                >
                  <Link
                    href={cat.href}
                    className="absolute inset-0 block focus:outline-none"
                    aria-label={`${cat.name} — ${cat.tagline}`}
                  >
                    <Image
                      src={cat.image}
                      alt={`${cat.name} — ${cat.tagline}`}
                      fill
                      sizes={isFeature ? '(max-width: 640px) 100vw, 45vw' : '(max-width: 640px) 50vw, 22vw'}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                      style={{ filter: 'saturate(0.94) contrast(0.98) brightness(1.0)' }}
                    />

                    {/* bottom gradient so text always reads on the photo */}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, transparent 38%, rgba(10,15,10,0.35) 70%, rgba(10,15,10,0.82) 100%)',
                      }}
                    />

                    {/* duration pill */}
                    <span
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"
                      style={{ backgroundColor: 'rgba(255,249,242,0.85)', color: INK }}
                    >
                      {cat.durationMin}&prime;
                    </span>

                    {cat.slug === feature.slug && (
                      <span
                        className="absolute left-3 top-3 rounded-full px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: LOTUS, color: '#FFF9F2' }}
                      >
                        Most loved
                      </span>
                    )}

                    {/* text on the image */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <p
                        className="font-display italic text-white/75"
                        style={{ fontSize: isFeature ? '13px' : '11px' }}
                      >
                        {cat.tagline}
                      </p>
                      <h3
                        className="mt-0.5 font-heading font-bold tracking-tight text-white"
                        style={{ fontSize: isFeature ? 'clamp(1.15rem, 2.2vw, 1.6rem)' : '15px' }}
                      >
                        {cat.name}
                      </h3>
                      <span
                        className="mt-2 block h-px w-7 transition-[width] duration-500 group-hover:w-16"
                        style={{ background: GOLD }}
                      />
                    </div>
                  </Link>
                </motion.li>
              )
            })
          })()}
        </motion.ol>
      </div>
    </section>
  )
}
