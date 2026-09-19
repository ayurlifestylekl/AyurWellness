/**
 * Shared types for the Journal (blog) feature.
 *
 * These mirror the GROQ projections in `src/sanity/queries.ts`.
 * Keep them in sync when adding fields to the post or author schemas.
 */

import type { PortableTextBlock } from '@portabletext/types'

export interface Author {
  _id: string
  name: string
  slug: string | null
  role: string | null
  imageUrl: string | null
  bio: string | null
}

/** Lightweight projection used by the listing page and related-posts strip. */
export interface PostListItem {
  _id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string
  heroImageUrl: string | null
  authorName: string | null
  tags: string[] | null
}

/** Full projection used by the /blog/[slug] detail page. */
export interface Post {
  _id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: string
  heroImageUrl: string | null
  heroImageAlt: string | null
  body: PortableTextBlock[]
  tags: string[] | null
  readingTimeMinutes: number | null
  author: Author
}
