import type { Metadata } from 'next'

import BlogIndex from '@/components/blog/BlogIndex'
import { sanityClient } from '@/sanity/client'
import { isSanityConfigured } from '@/sanity/env'
import { POSTS_INDEX_QUERY } from '@/sanity/queries'
import type { PostListItem } from '@/types/blog'

export const metadata: Metadata = {
  title: 'The Journal — Notes from a our Vaidya',
  description:
    'Stories, daily rituals, seasonal protocols and field notes from our Vaidyas at Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'The Journal — Ayurvedic Wellness Centre',
    description:
      'Authentic Ayurveda writing from a practising our Vaidya. Read stories, rituals and seasonal protocols.',
    url: 'https://ayurvedawellness.com.my/blog',
    type: 'website',
  },
}

// Short revalidate so new posts published in Sanity Studio appear on
// the live site within ~30s instead of up to an hour.
export const revalidate = 30

async function loadPosts(): Promise<PostListItem[]> {
  if (!isSanityConfigured) return []
  try {
    const posts = await sanityClient.fetch<PostListItem[]>(POSTS_INDEX_QUERY)
    return posts ?? []
  } catch (err) {
    console.error('[blog] Sanity fetch failed:', err)
    return []
  }
}

export default async function BlogPage() {
  const posts = await loadPosts()
  return <BlogIndex posts={posts} />
}
