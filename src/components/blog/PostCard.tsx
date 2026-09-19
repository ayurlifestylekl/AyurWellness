'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

import { fadeUp } from '@/lib/motion'
import type { PostListItem } from '@/types/blog'

interface PostCardProps {
  post: PostListItem
  /** Optional 1-based card index used for the eyebrow numbering */
  index?: number
  total?: number
  /** Larger feature variant for the first card on the index page */
  variant?: 'default' | 'feature' | 'compact'
}

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Editorial card for the blog index and related-posts strip.
 *
 * - `default`  — three-column grid card with floating arrow disc
 * - `feature`  — large asymmetric card with frame-in-frame and volume marker
 * - `compact`  — small mini-card for the bottom "Continue reading" strip
 */
export default function PostCard({
  post,
  index,
  total,
  variant = 'default',
}: PostCardProps) {
  const formattedDate = (() => {
    try {
      return format(new Date(post.publishedAt), 'd MMMM yyyy')
    } catch {
      return post.publishedAt.slice(0, 10)
    }
  })()

  const indexNumeral = index != null ? String(index).padStart(2, '0') : null
  const totalNumeral = total != null ? String(total).padStart(2, '0') : null

  // ── feature variant ────────────────────────────────────────────────
  if (variant === 'feature') {
    return (
      <motion.article
        variants={fadeUp(0)}
        layout
        className="group relative grid grid-cols-1 overflow-hidden rounded-[28px] bg-gradient-to-br from-white via-white to-[#EDF4E7] ring-1 ring-accent/25 shadow-floating transition-[transform,box-shadow] duration-700 ease-out hover:-translate-y-1.5 hover:shadow-luxe lg:grid-cols-12"
      >
        {/* Frame-in-frame letterpress margin */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[14px] z-[3] rounded-[14px] border border-accent/15"
        />

        {/* Image */}
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-auto"
          aria-label={post.title}
        >
          {post.heroImageUrl ? (
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/10" />
          )}

          {/* Primary dark-green editorial gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/45 via-primary/10 to-transparent mix-blend-multiply"
          />
          {/* Duotone warmth (gold → green) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-primary/20 mix-blend-overlay"
          />
          {/* Film grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{ backgroundImage: NOISE_SVG }}
          />
          {/* Hover vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_80px_rgba(0,107,60,0.4)] transition-opacity duration-700 ease-out group-hover:opacity-100"
          />

          {/* Editorial volume marker (replaces flat "Featured" pill) */}
          <div className="absolute left-6 top-6 flex flex-col items-start gap-1.5 rounded-[4px] bg-white/88 px-4 py-3 ring-1 ring-accent/30 backdrop-blur-md">
            <span className="font-heading text-[8.5px] font-extrabold uppercase tracking-[0.3em] text-primary/60">
              Vol. I
            </span>
            <span aria-hidden className="h-px w-5 bg-accent" />
            <span className="font-heading text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-primary">
              The Journal
            </span>
          </div>
        </Link>

        {/* Text */}
        <div className="relative z-[2] flex flex-col justify-center gap-6 p-8 sm:p-10 lg:col-span-5 lg:p-12">
          {/* Eyebrow: Nº <index> · date */}
          <div className="flex items-center gap-3">
            <span className="flex items-baseline gap-[3px]">
              <span className="font-body text-[26px] italic leading-none text-accent">
                Nº
              </span>
              <span className="font-heading text-[14px] font-extrabold leading-none tracking-tight text-primary">
                {indexNumeral ?? '01'}
              </span>
              {totalNumeral && (
                <span className="ml-1 font-heading text-[9.5px] font-bold leading-none tracking-[0.1em] text-primary/40">
                  / {totalNumeral}
                </span>
              )}
            </span>
            <span aria-hidden className="h-px w-6 bg-accent/50" />
            <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.24em] text-primary/55">
              {formattedDate}
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title + expanding gold hairline */}
          <div className="flex flex-col gap-4">
            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="font-heading text-[28px] font-extrabold leading-[1.05] tracking-[-0.024em] text-primary transition-colors duration-300 group-hover:text-primary/85 sm:text-[34px] md:text-[40px]">
                {post.title}
              </h2>
            </Link>
            <span
              aria-hidden
              className="h-px w-14 bg-accent transition-[width] duration-700 ease-out group-hover:w-28"
            />
          </div>

          {post.excerpt && (
            <p className="font-body text-[16px] leading-[1.8] text-dark/70 first-line:font-medium first-line:italic first-line:text-primary/85">
              {post.excerpt}
            </p>
          )}

          {post.authorName && (
            <p className="font-heading text-[10.5px] font-bold uppercase tracking-[0.22em] text-dark/55">
              By <span className="text-primary/80">{post.authorName}</span>
            </p>
          )}

          {/* CTA pill */}
          <Link
            href={`/blog/${post.slug}`}
            className="group/cta mt-2 inline-flex w-fit items-center gap-2.5 rounded-full border border-primary/30 bg-transparent px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-[background-color,color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span>Read article</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
              strokeWidth={2.6}
            />
          </Link>
        </div>
      </motion.article>
    )
  }

  // ── compact variant ────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <motion.article
        variants={fadeUp(0)}
        layout
        className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-gradient-to-br from-white via-white to-[#EDF4E7] ring-1 ring-primary/10 shadow-elevated transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-floating hover:ring-accent/25"
      >
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[16/10] overflow-hidden"
          aria-label={post.title}
        >
          {post.heroImageUrl ? (
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/10" />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent mix-blend-multiply"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/15 mix-blend-overlay"
          />
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.22em] text-primary/55">
            {formattedDate}
          </span>
          <Link href={`/blog/${post.slug}`}>
            <h3 className="font-heading text-[18px] font-extrabold leading-[1.2] tracking-[-0.018em] text-primary transition-colors duration-300 group-hover:text-primary/80">
              {post.title}
            </h3>
          </Link>
          <span
            aria-hidden
            className="h-px w-8 bg-accent transition-[width] duration-500 ease-out group-hover:w-16"
          />
          {post.excerpt && (
            <p className="line-clamp-2 font-body text-[14px] leading-[1.7] text-dark/65">
              {post.excerpt}
            </p>
          )}
        </div>
      </motion.article>
    )
  }

  // ── default grid card ──────────────────────────────────────────────
  return (
    <motion.article
      variants={fadeUp(0)}
      layout
      className="group relative flex h-full flex-col rounded-[22px] bg-gradient-to-br from-white via-white to-[#EDF4E7] ring-1 ring-primary/10 shadow-elevated transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:shadow-floating hover:ring-accent/30"
    >
      {/* Image block — relative container lets the floating disc escape below */}
      <div className="relative">
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[4/3] overflow-hidden rounded-t-[22px]"
          aria-label={post.title}
        >
          {post.heroImageUrl ? (
            <Image
              src={post.heroImageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/10" />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent mix-blend-multiply"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/12 via-transparent to-primary/20 mix-blend-overlay"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{ backgroundImage: NOISE_SVG }}
          />
        </Link>

        {/* Floating arrow disc — half-overlapping image/text boundary */}
        <Link
          href={`/blog/${post.slug}`}
          aria-label={`Read article: ${post.title}`}
          className="absolute -bottom-5 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-[#EDF4E7] text-primary shadow-elevated transition-[transform,background-color,border-color,color,box-shadow] duration-500 ease-out group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-dark group-hover:shadow-gold-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.6} />
        </Link>
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col gap-4 px-7 pb-7 pt-8">
        {/* Eyebrow row: Nº <index> · date */}
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-baseline gap-[3px]">
            {indexNumeral && (
              <>
                <span className="font-body text-[20px] italic leading-none text-accent">
                  Nº
                </span>
                <span className="font-heading text-[12px] font-extrabold leading-none tracking-tight text-primary">
                  {indexNumeral}
                </span>
                {totalNumeral && (
                  <span className="ml-1 font-heading text-[8.5px] font-bold leading-none tracking-[0.1em] text-primary/35">
                    / {totalNumeral}
                  </span>
                )}
              </>
            )}
          </span>
          <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.22em] text-primary/55">
            {formattedDate}
          </span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 font-heading text-[9px] font-semibold uppercase tracking-[0.16em] text-primary/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title + expanding gold hairline */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-heading text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-primary transition-colors duration-300 group-hover:text-primary/85 sm:text-[24px]">
            {post.title}
          </h3>
        </Link>
        <span
          aria-hidden
          className="h-px w-10 bg-accent transition-[width] duration-500 ease-out group-hover:w-20"
        />

        {post.excerpt && (
          <p className="line-clamp-3 font-body text-[15px] leading-[1.7] text-dark/70">
            {post.excerpt}
          </p>
        )}

        <div className="flex-1" />

        {/* Footer — author byline with gold accent dot */}
        {post.authorName && (
          <div className="flex items-center gap-2.5 border-t border-primary/10 pt-5 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-dark/55">
            <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />
            <span>
              By <span className="text-primary/80">{post.authorName}</span>
            </span>
          </div>
        )}
      </div>
    </motion.article>
  )
}
