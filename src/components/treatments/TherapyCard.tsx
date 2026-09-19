'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { urlForImage } from '@/sanity/image'
import { fadeUp } from '@/lib/motion'
import { formatPrice } from '@/lib/treatments/price'
import type { TreatmentSummary } from '@/types/treatments'

interface TherapyCardProps {
  treatment: TreatmentSummary
  categorySlug: string
  romanIndex: string
}

export default function TherapyCard({
  treatment,
  categorySlug,
  romanIndex,
}: TherapyCardProps) {
  const href = `/treatments/${categorySlug}/${treatment.slug}`

  return (
    <motion.div variants={fadeUp(0)}>
      <Link
        href={href}
        className="group block h-full overflow-hidden rounded-xl border border-accent/30 bg-white transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <div className="grid h-full grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr]">
          {/* Image with corner accents */}
          <div className="relative overflow-hidden">
            {treatment.heroImageUrl ? (
              <Image
                src={treatment.heroImageUrl}
                alt={`${treatment.title} image`}
                fill
                sizes="(max-width: 640px) 130px, 150px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : treatment.heroImage ? (
              <Image
                src={urlForImage(treatment.heroImage).width(320).height(500).fit('crop').url()}
                alt={treatment.heroImage.alt ?? `${treatment.title} image`}
                fill
                sizes="(max-width: 640px) 130px, 150px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 bg-primary"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(181, 138, 59,0.18) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
                aria-hidden
              />
            )}
            <span className="pointer-events-none absolute left-1 top-1 h-2 w-2 border-l-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute right-1 top-1 h-2 w-2 border-r-2 border-t-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-accent" aria-hidden />
            <span className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-accent" aria-hidden />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between p-4 sm:p-5">
            <div>
              <div className="font-display text-[18px] italic leading-none text-accent">
                {romanIndex}
              </div>
              <h3 className="mt-1 font-heading text-[16px] font-extrabold leading-tight tracking-[-0.015em] text-primary sm:text-[18px]">
                {treatment.title}
              </h3>
              {treatment.description && (
                <p className="mt-1.5 line-clamp-2 font-body text-[12.5px] italic leading-[1.45] text-dark/65">
                  {treatment.description}
                </p>
              )}
            </div>

            <div
              className="mt-3 h-px"
              style={{
                background:
                  'linear-gradient(to right, rgba(181, 138, 59,0.5), transparent)',
              }}
              aria-hidden
            />

            <div className="mt-2 flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-[0.16em] text-dark/55">
              <span className="flex items-center gap-2">
                <span>{treatment.duration ?? 'See practitioner'}</span>
                <span className="text-accent">·</span>
                <span className="text-accent">{formatPrice(treatment)}</span>
              </span>
              <span className="text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                Read →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
