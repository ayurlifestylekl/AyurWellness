'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { urlForImage } from '@/sanity/image'
import { fadeUp } from '@/lib/motion'
import type { TreatmentCategory } from '@/types/treatments'

interface CategoryBoxProps {
  category: TreatmentCategory
  index: number
}

/**
 * Style B with corner accents (locked 2026-05-25).
 * Image-left + content-right card. Gold L-corners on the image panel.
 * Whole card links to /treatments/<slug>.
 */
export default function CategoryBox({ category, index }: CategoryBoxProps) {
  // slug is optional on TreatmentCategory (legacy booking query omits it).
  // CategoryGrid is only used from the new L1 page which always projects slug,
  // but guard defensively so we never build a broken href.
  if (!category.slug) return null

  const number = String(index + 1).padStart(2, '0')
  const count = category.treatmentCount ?? 0
  const href = `/treatments/${category.slug}`

  return (
    <motion.div variants={fadeUp(0)}>
      <Link
        href={href}
        className="group block overflow-hidden rounded-2xl border border-accent/25 bg-cream transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={`${category.title} — ${count} ${count === 1 ? 'therapy' : 'therapies'}`}
      >
        <div className="grid h-full grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr]">
          {/* Image panel with corner accents */}
          <div className="relative overflow-hidden bg-primary">
            {category.imageUrl ? (
              <>
                <Image
                  src={category.imageUrl}
                  alt={`${category.title} — traditional Ayurveda`}
                  fill
                  sizes="(max-width: 640px) 140px, 160px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* maroon wash for brand cohesion + corner-accent legibility */}
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{ background: 'linear-gradient(135deg, rgba(18,55,45,0.45), rgba(20,148,71,0.25))' }}
                  aria-hidden
                />
              </>
            ) : category.image ? (
              <Image
                src={urlForImage(category.image).width(400).height(500).fit('crop').url()}
                alt={category.image.alt ?? `${category.title} image`}
                fill
                sizes="(max-width: 640px) 140px, 160px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 bg-primary"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(181, 138, 59,0.18) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
                aria-hidden
              />
            )}
            {/* Gold L-corners */}
            <span className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute right-1 top-1 h-2.5 w-2.5 border-r-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-accent" aria-hidden />
          </div>

          {/* Content panel */}
          <div className="flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="font-heading text-[14px] font-black tracking-[0.12em] text-accent">
                {number}
              </div>
              <h3 className="mt-1 font-heading text-[18px] font-extrabold leading-tight tracking-[-0.018em] text-primary sm:text-[20px]">
                {category.title}
              </h3>
              <div
                className="my-2.5 h-px"
                style={{
                  background:
                    'linear-gradient(to right, rgba(181, 138, 59,0.5), transparent)',
                }}
                aria-hidden
              />
              {category.description && (
                <p className="font-body text-[13px] italic leading-[1.5] text-dark/70">
                  {category.description}
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-dark/55">
              <span>
                {count} {count === 1 ? 'Therapy' : 'Therapies'}
              </span>
              <span className="text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                View →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
