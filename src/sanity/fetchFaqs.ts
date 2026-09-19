import { sanityClient } from './client'
import { isSanityConfigured } from './env'
import { FAQS_BY_SURFACE_QUERY } from './queries'
import type { FAQ } from '@/data/faqs'

export type FaqSurface = 'home' | 'contact' | 'about'

interface SanityFaq {
  _id: string
  question: string
  answer: string
  surface: FaqSurface
  categoryTitle: string | null
}

/**
 * Load FAQs for a given surface from Sanity and shape them into the `FAQ`
 * type already consumed by `components/sections/FAQs.tsx` and
 * `components/contact/Footnotes.tsx`. Returns `fallback` on any error or
 * when the Sanity project isn't configured — keeps the site alive while
 * content is being migrated.
 */
export async function fetchFaqs(
  surface: FaqSurface,
  fallback: FAQ[],
): Promise<FAQ[]> {
  if (!isSanityConfigured) return fallback
  try {
    const rows = await sanityClient.fetch<SanityFaq[]>(
      FAQS_BY_SURFACE_QUERY,
      { surface },
    )
    if (!rows || rows.length === 0) return fallback
    return rows.map((row) => ({
      id: row._id,
      question: row.question,
      answer: row.answer,
    }))
  } catch (err) {
    console.error(`[faqs] Sanity fetch failed for surface=${surface}:`, err)
    return fallback
  }
}
