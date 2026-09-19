'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { BotanicalMandala, FloatingLeaf } from '@/components/ui/Decorations'
import { fadeUp, inViewOnce, staggerParent } from '@/lib/motion'
import type { PostListItem } from '@/types/blog'

import PostCard from './PostCard'

interface BlogIndexProps {
  posts: PostListItem[]
}

/**
 * Editorial-magazine listing for /blog.
 *
 * Layout:
 *   - Section marker + headline + intro
 *   - First post → full-width "feature" card (image left, text right)
 *   - Remaining posts → 3-column grid of standard PostCards
 *   - Empty state when Sanity returns nothing
 */
export default function BlogIndex({ posts }: BlogIndexProps) {
  const [featured, ...rest] = posts
  const total = posts.length

  return (
    <section
      aria-labelledby="journal-heading"
      className="relative overflow-hidden bg-[#EDF4E7]"
    >
      {/* Atmospheric layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 8% 12%, rgba(181, 138, 59,0.12) 0%, transparent 50%), radial-gradient(ellipse at 92% 88%, rgba(0,107,60,0.10) 0%, transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute -left-32 top-32 hidden h-[460px] w-[460px] md:block">
        <BotanicalMandala opacity={0.13} />
      </div>
      <div className="pointer-events-none absolute -right-32 bottom-48 hidden h-[480px] w-[480px] md:block">
        <BotanicalMandala opacity={0.11} />
      </div>
      <FloatingLeaf
        className="pointer-events-none absolute"
        style={{ left: '6%', top: '8%', width: 36, height: 48, transform: 'rotate(-22deg)' }}
        opacity={0.18}
      />
      <FloatingLeaf
        className="pointer-events-none absolute"
        style={{ right: '7%', top: '14%', width: 42, height: 56, transform: 'rotate(18deg)' }}
        opacity={0.15}
      />

      {/* ── Header ──────────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-6 pt-10 sm:px-8 md:pt-14 lg:px-12">
        <motion.div
          variants={staggerParent(0.1, 0.05)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col items-start gap-6"
        >
          {/* Section marker */}
          <div className="flex w-full items-center justify-between">
            <motion.span
              variants={fadeUp(0)}
              className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent/85"
            >
              <span className="text-primary/40">008</span> &nbsp;/&nbsp; The Journal
            </motion.span>
            {total > 0 && (
              <motion.span
                variants={fadeUp(0)}
                className="hidden font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40 md:inline"
              >
                {total} {total === 1 ? 'story' : 'stories'}
              </motion.span>
            )}
          </div>

          <motion.div
            variants={fadeUp(0)}
            aria-hidden
            className="h-px w-full bg-gradient-to-r from-accent/55 via-primary/15 to-transparent"
          />

          {/* Eyebrow chip */}
          <motion.span
            variants={fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/60 px-4 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-accent" strokeWidth={2.4} />
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              Notes from the Vaidya
            </span>
          </motion.span>

          {/* Headline */}
          <motion.h1
            id="journal-heading"
            variants={fadeUp(0)}
            className="font-heading text-balance text-[44px] font-extrabold leading-[0.98] tracking-[-0.025em] text-primary sm:text-[60px] md:text-[76px]"
          >
            Stories from
            <br />
            <span className="font-body italic font-normal text-accent">
              the sanctuary.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp(0)}
            className="max-w-2xl font-body text-[16px] leading-[1.85] text-dark/70 md:text-[17px]"
          >
            Daily rituals, seasonal protocols and field notes from a practising
            our Vaidya. Read at your own pace — these articles are written for
            anyone curious about authentic Ayurveda, not just the initiated.
          </motion.p>
        </motion.div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:px-8 md:pb-32 md:pt-20 lg:px-12">
        {posts.length === 0 ? (
          // Empty state
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-[24px] border border-dashed border-primary/20 bg-white/40 px-10 py-16 text-center">
            <Sparkles className="h-6 w-6 text-accent" strokeWidth={2} />
            <h2 className="font-heading text-[24px] font-extrabold leading-[1.1] text-primary">
              The first stories are being written.
            </h2>
            <p className="font-body text-[15px] italic leading-[1.7] text-dark/65">
              Our journal launches with six articles from the Vaidya. Until then,
              browse the treatment library or message us on WhatsApp for guidance.
            </p>
            <Link
              href="/treatments"
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-primary transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/5"
            >
              See the Treatment Library
            </Link>
          </div>
        ) : (
          <motion.div
            variants={staggerParent(0.08, 0.05)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="flex flex-col gap-10"
          >
            {/* Featured */}
            {featured && (
              <PostCard post={featured} index={1} total={total} variant="feature" />
            )}

            {/* Grid of remaining posts */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, idx) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    index={idx + 2}
                    total={total}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
