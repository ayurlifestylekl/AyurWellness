'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

const GOLD = '#B58A3B'
const INK = '#006B3C'

const PAPER_MOTTLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E\")"

function Tile({
  src,
  alt,
  label,
  className = '',
}: {
  src: string
  alt: string
  label: string
  className?: string
}) {
  return (
    <div className={`group relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[3/4] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-16"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(10,20,15,0.75))' }}
      />
      <span className="absolute bottom-3 left-4 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white">
        {label}
      </span>
    </div>
  )
}

/**
 * Centre Gallery — real photos of the physical space (exterior, reception,
 * lounge, treatment room), placed between Our Philosophy (dark) and Our
 * People (light editorial) so it reads as its own visual beat: a bento
 * of real photography rather than illustrated cards or typography.
 */
export default function CentreGallery() {
  return (
    <section aria-labelledby="gallery-heading" className="relative overflow-hidden" style={{ backgroundColor: '#FFF9F2' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgba(181,138,59,0.07) 0%, transparent 62%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.08, mixBlendMode: 'multiply', backgroundImage: PAPER_MOTTLE, backgroundSize: '640px 640px' }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 4%, ${GOLD}70 50%, transparent 96%)` }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 sm:px-8 lg:py-12">
        {/* Header */}
        <motion.div variants={fadeUp(0)} initial="initial" whileInView="animate" viewport={inViewOnce} className="mx-auto max-w-xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD, opacity: 0.7 }} />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD }}>
              Take A Look Inside
            </span>
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD, opacity: 0.7 }} />
          </div>
          <h2
            id="gallery-heading"
            className="mt-3 font-heading font-extrabold leading-[1.1]"
            style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)', letterSpacing: '-0.02em', color: INK }}
          >
            Step inside{' '}
            <span className="font-display italic" style={{ color: GOLD }}>
              our centre.
            </span>
          </h2>
          <p className="mt-2 font-body text-[13.5px] italic leading-[1.55]" style={{ color: 'rgba(0,42,25,0.6)' }}>
            A real look at the space — from our Brickfields storefront to the room your treatment happens in.
          </p>
        </motion.div>

        {/* Gallery — one even row, four equal tiles */}
        <motion.div
          variants={staggerParent(0.06, 0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          <motion.div variants={fadeUp(0)}>
            <Tile
              src="/about/gallery-exterior.jpg"
              alt="Ayurvedic Wellness Centre — storefront in Brickfields, Kuala Lumpur"
              label="Our Storefront"
            />
          </motion.div>
          <motion.div variants={fadeUp(0)}>
            <Tile
              src="/about/gallery-frontdesk.jpg"
              alt="Ayurvedic Wellness Centre — reception desk"
              label="Reception"
            />
          </motion.div>
          <motion.div variants={fadeUp(0)}>
            <Tile
              src="/about/centre-lounge.jpg"
              alt="Ayurvedic Wellness Centre — guest lounge"
              label="Guest Lounge"
            />
          </motion.div>
          <motion.div variants={fadeUp(0)}>
            <Tile
              src="/about/gallery-treatment-room.jpg"
              alt="Ayurvedic Wellness Centre — treatment room"
              label="Treatment Room"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
