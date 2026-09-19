import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Calendar, MessageCircle } from 'lucide-react'
import type { PortableTextBlock } from '@portabletext/types'

import AuthorBioCard from '@/components/blog/AuthorBioCard'
import PostBody from '@/components/blog/PostBody'
import PostHero from '@/components/blog/PostHero'
import ReadingProgress from '@/components/blog/ReadingProgress'
import RelatedPosts from '@/components/blog/RelatedPosts'
import { sanityClient } from '@/sanity/client'
import { isSanityConfigured } from '@/sanity/env'
import {
  POST_BY_SLUG_QUERY,
  POST_SLUGS_QUERY,
  RELATED_POSTS_QUERY,
} from '@/sanity/queries'
import type { Post, PostListItem } from '@/types/blog'

// ── Static generation + ISR ──────────────────────────────────────────
// Short window so edits to a post published in Sanity Studio show up
// on the live article within ~30s.
export const revalidate = 30
export const dynamicParams = true

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  if (!isSanityConfigured) return []
  try {
    const slugs = await sanityClient.fetch<string[]>(POST_SLUGS_QUERY)
    return (slugs ?? []).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ── Per-post SEO ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await loadPost(params.slug)
  if (!post) {
    return {
      title: 'Article not found',
      robots: { index: false, follow: true },
    }
  }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.heroImageUrl
        ? [
            {
              url: post.heroImageUrl,
              width: 1200,
              height: 630,
              alt: post.heroImageAlt ?? post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    },
  }
}

// ── Data loaders ─────────────────────────────────────────────────────
async function loadPost(slug: string): Promise<Post | null> {
  if (!isSanityConfigured) return null
  try {
    const post = await sanityClient.fetch<Post | null>(POST_BY_SLUG_QUERY, {
      slug,
    })
    return post ?? null
  } catch (err) {
    console.error('[blog] Sanity fetch failed for slug:', slug, err)
    return null
  }
}

async function loadRelated(currentId: string): Promise<PostListItem[]> {
  if (!isSanityConfigured) return []
  try {
    const posts = await sanityClient.fetch<PostListItem[]>(RELATED_POSTS_QUERY, {
      currentId,
    })
    return posts ?? []
  } catch {
    return []
  }
}

/**
 * Estimate reading time from the body (220 wpm). Used when the editor
 * hasn't manually set `readingTimeMinutes` in Sanity.
 */
type TextChild = { _type?: string; text?: string }
type TextBlock = PortableTextBlock & { children?: TextChild[] }

function estimateReadingMinutes(blocks: PortableTextBlock[] | null): number {
  if (!blocks || blocks.length === 0) return 1
  const text = (blocks as TextBlock[])
    .filter((b) => b._type === 'block')
    .flatMap((b) => (b.children ?? []).map((c) => c.text ?? ''))
    .join(' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

// ── Page ─────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await loadPost(params.slug)
  if (!post) notFound()

  const readingMinutes =
    post.readingTimeMinutes ?? estimateReadingMinutes(post.body ?? [])

  const related = await loadRelated(post._id)

  return (
    <>
      <ReadingProgress />

      {/* Hero */}
      <PostHero post={post} readingMinutes={readingMinutes} />

      {/* Body */}
      <div className="relative bg-[#EDF4E7]">
        <PostBody body={post.body ?? []} />

        {/* Author bio */}
        <div className="pb-20 md:pb-28">
          <AuthorBioCard author={post.author} />
        </div>

        {/* Related posts */}
        <RelatedPosts posts={related} />

        {/* Bottom CTA strip */}
        <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-20 sm:px-8 md:pb-32 md:pt-28 lg:px-12">
          <div className="relative overflow-hidden rounded-[24px] border border-primary/15 bg-white/60 px-8 py-10 text-center backdrop-blur-sm sm:px-12 md:px-16 md:py-14">
            {/* Soft gold radial glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 520,
                height: 520,
                background:
                  'radial-gradient(circle at center, rgba(181, 138, 59,0.18) 0%, rgba(181, 138, 59,0.06) 30%, transparent 65%)',
                filter: 'blur(28px)',
              }}
            />

            <div className="relative flex flex-col items-center gap-5">
              <span className="font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                Ready to begin?
              </span>
              <h3 className="font-heading text-balance text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-primary sm:text-[34px] md:text-[40px]">
                Want this protocol{' '}
                <span className="font-body italic font-normal text-accent">
                  personalised
                </span>{' '}
                for you?
              </h3>
              <p className="max-w-xl font-body text-[16px] leading-[1.75] text-dark/70">
                Book a free consultation with {post.author.name} at our Brickfields
                Centre — we&rsquo;ll design a treatment plan tailored to your dosha
                and lifestyle.
              </p>
              <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href="/book/consultation"
                  className="group/cta relative inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-7 py-3.5 font-heading text-[12px] font-bold uppercase tracking-[0.18em] text-dark shadow-[0_18px_44px_-16px_rgba(181, 138, 59,0.85)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-14px_rgba(181, 138, 59,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  <Calendar className="relative z-10 h-4 w-4" strokeWidth={2.4} />
                  <span className="relative z-10">Book a Consultation</span>
                  <ArrowUpRight
                    className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
                    strokeWidth={2.6}
                  />
                </Link>
                <Link
                  href="https://wa.me/601163393436"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-primary/30 bg-white px-7 py-3.5 font-heading text-[12px] font-bold uppercase tracking-[0.18em] text-primary transition-[transform,background-color,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.97]"
                >
                  <MessageCircle className="h-4 w-4 text-secondary" strokeWidth={2.4} />
                  WhatsApp Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
