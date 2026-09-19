import type { MetadataRoute } from 'next'

import { sanityClient } from '@/sanity/client'
import { isSanityConfigured } from '@/sanity/env'
import {
  CATEGORY_SLUGS_QUERY,
  TREATMENT_SLUG_PAIRS_QUERY,
} from '@/sanity/queries'
import { CLINIC_DOMAIN } from '@/lib/clinic'

const BASE = `https://${CLINIC_DOMAIN}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, priority: 1.0 },
    { url: `${BASE}/treatments`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.5 },
  ]

  const treatmentRoutes: MetadataRoute.Sitemap = []
  if (isSanityConfigured) {
    try {
      const [categorySlugs, treatmentPairs] = await Promise.all([
        sanityClient.fetch<string[]>(CATEGORY_SLUGS_QUERY),
        sanityClient.fetch<Array<{ categorySlug: string; treatmentSlug: string }>>(
          TREATMENT_SLUG_PAIRS_QUERY,
        ),
      ])
      for (const slug of categorySlugs ?? []) {
        treatmentRoutes.push({
          url: `${BASE}/treatments/${slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
      for (const pair of treatmentPairs ?? []) {
        treatmentRoutes.push({
          url: `${BASE}/treatments/${pair.categorySlug}/${pair.treatmentSlug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    } catch (err) {
      console.error('[sitemap] treatments fetch failed:', err)
    }
  }

  return [...staticRoutes, ...treatmentRoutes]
}
