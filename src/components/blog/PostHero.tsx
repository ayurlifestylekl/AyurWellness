'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { fadeUp, staggerParent } from '@/lib/motion'
import { BotanicalMandala, FloatingLeaf } from '@/components/ui/Decorations'
import type { Post } from '@/types/blog'

import PostMeta from './PostMeta'

interface PostHeroProps {
  post: Post
  readingMinutes: number
}

/**
 * Editorial-magazine hero for an article.
 *
 * Layout (top to bottom):
 *   1. Section marker  "008 / The Journal"
 *   2. Tag pills (small caps)
 *   3. Massive Montserrat 800 title (tracking -0.03em)
 *   4. Lora italic excerpt
 *   5. Compact byline row (PostMeta)
 *   6. Full-bleed hero image with gradient + grain overlay
 */
export default function PostHero({ post, readingMinutes }: PostHeroProps) {
  return (
    <header className="relative overflow-hidden bg-[#EDF4E7]">
      {/* ── Atmospheric backdrop ───────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 8% 10%, rgba(181, 138, 59,0.16) 0%, transparent 55%), radial-gradient(ellipse at 92% 0%, rgba(0,107,60,0.10) 0%, transparent 50%)',
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
      {/* Mandala flank */}
      <div className="pointer-events-none absolute -left-32 top-32 hidden h-[460px] w-[460px] md:block">
        <BotanicalMandala opacity={0.10} />
      </div>
      {/* Floating leaf */}
      <FloatingLeaf
        className="pointer-events-none absolute"
        style={{
          right: '8%',
          top: '14%',
          width: 38,
          height: 50,
          transform: 'rotate(18deg)',
        }}
        opacity={0.18}
      />

      {/* ── Top section: marker + title + meta ─────────── */}
      <div className="relative mx-auto max-w-4xl px-6 pt-20 sm:px-8 md:pt-28 lg:px-12">
        <motion.div
          variants={staggerParent(0.1, 0.05)}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-8"
        >
          {/* Section marker */}
          <motion.div variants={fadeUp(0)} className="flex items-center gap-3">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent/85">
              <span className="text-primary/40">008</span> &nbsp;/&nbsp; The Journal
            </span>
            <span aria-hidden className="h-px w-12 bg-accent/40" />
          </motion.div>

          {/* Tag pills */}
          {post.tags && post.tags.length > 0 && (
            <motion.div variants={fadeUp(0)} className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/15 bg-white px-3 py-1.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.18em] text-primary/75"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* Title — the visual centerpiece */}
          <motion.h1
            variants={fadeUp(0)}
            className="font-heading text-balance text-[40px] font-extrabold leading-[0.98] tracking-[-0.028em] text-primary sm:text-[56px] md:text-[68px] lg:text-[78px]"
          >
            {post.title}
          </motion.h1>

          {/* Excerpt */}
          {post.excerpt && (
            <motion.p
              variants={fadeUp(0)}
              className="max-w-2xl font-body text-[19px] italic leading-[1.55] text-dark/65 md:text-[22px]"
            >
              {post.excerpt}
            </motion.p>
          )}

          {/* Hairline */}
          <motion.div
            variants={fadeUp(0)}
            aria-hidden
            className="h-px w-full bg-gradient-to-r from-accent/55 via-primary/15 to-transparent"
          />

          {/* Byline */}
          <motion.div variants={fadeUp(0)}>
            <PostMeta
              authorName={post.author.name}
              authorRole={post.author.role}
              authorImageUrl={post.author.imageUrl}
              publishedAt={post.publishedAt}
              readingMinutes={readingMinutes}
              variant="light"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Hero image ─────────────────────────────────── */}
      {post.heroImageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 0.92, 0.38, 1] }}
          className="relative mx-auto mt-16 max-w-[1280px] px-6 sm:mt-20 sm:px-8 lg:px-12"
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] shadow-[0_2px_4px_rgba(0,107,60,0.06),0_40px_100px_-30px_rgba(0,107,60,0.32)] ring-1 ring-primary/10">
            <Image
              src={post.heroImageUrl}
              alt={post.heroImageAlt ?? post.title}
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
            />
            {/* Gradient + grain — per the house anti-generic image rules */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />
          </div>
        </motion.div>
      )}
    </header>
  )
}
