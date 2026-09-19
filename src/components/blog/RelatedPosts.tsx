'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { fadeUp, inViewOnce, staggerParent } from '@/lib/motion'
import type { PostListItem } from '@/types/blog'

import PostCard from './PostCard'

interface RelatedPostsProps {
  posts: PostListItem[]
}

/**
 * "Continue reading" footer strip — three most-recent posts excluding
 * the one currently being read. Renders nothing if there are no others.
 */
export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null

  return (
    <section
      aria-labelledby="related-heading"
      className="relative mx-auto max-w-7xl px-6 pt-24 sm:px-8 md:pt-32 lg:px-12"
    >
      {/* Section marker */}
      <motion.div
        variants={staggerParent(0.1, 0.05)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="flex flex-col items-start gap-5"
      >
        <motion.div variants={fadeUp(0)} className="flex items-center gap-3">
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent/85">
            <span className="text-primary/40">009</span> &nbsp;/&nbsp; Continue reading
          </span>
          <span aria-hidden className="h-px w-12 bg-accent/40" />
        </motion.div>

        <motion.h2
          id="related-heading"
          variants={fadeUp(0)}
          className="font-heading text-balance text-[32px] font-extrabold leading-[1.05] tracking-[-0.025em] text-primary sm:text-[40px] md:text-[48px]"
        >
          More from{' '}
          <span className="font-body italic font-normal text-accent">the journal.</span>
        </motion.h2>

        <motion.div
          variants={fadeUp(0)}
          aria-hidden
          className="h-px w-full max-w-md bg-gradient-to-r from-accent/55 via-primary/15 to-transparent"
        />
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={staggerParent(0.08, 0.1)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {posts.map((p) => (
          <PostCard key={p._id} post={p} variant="compact" />
        ))}
      </motion.div>
    </section>
  )
}
