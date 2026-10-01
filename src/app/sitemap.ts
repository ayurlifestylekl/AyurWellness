import type { MetadataRoute } from 'next'

import { sanityClient } from '@/sanity/client'
import { isSanityConfigured } from '@/sanity/env'
import { POST_SLUGS_QUERY } from '@/sanity/queries'
import { getAllCategories, getTreatmentsByCategorySlug } from '@/data/treatments'
import { products } from '@/data/products'
import { CLINIC_DOMAIN } from '@/lib/clinic'

const BASE = `https://${CLINIC_DOMAIN}`

/**
 * Lists every public page that actually exists.
 *
 * Therapies and products are read from the same local data modules the pages
 * themselves use for `generateStaticParams`, so this can never advertise a URL
 * that 404s, or miss one that exists. (It previously read therapies from
 * Sanity, which this site no longer uses — so only 5 pages were listed.)
 *
 * Blog posts still come from Sanity; until it's connected there are none.
 *
 * Deliberately left out: account, checkout, cart, booking-flow and staff
 * pages. They're private or transactional, and robots.ts already disallows
 * them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/treatments`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/book`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/book/consultation`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const treatmentRoutes: MetadataRoute.Sitemap = []
  for (const category of getAllCategories()) {
    treatmentRoutes.push({
      url: `${BASE}/treatments/${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
    for (const treatment of getTreatmentsByCategorySlug(category.slug)) {
      treatmentRoutes.push({
        url: `${BASE}/treatments/${category.slug}/${treatment.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/products/${p.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const postRoutes: MetadataRoute.Sitemap = []
  if (isSanityConfigured) {
    try {
      const slugs = await sanityClient.fetch<string[]>(POST_SLUGS_QUERY)
      for (const slug of slugs ?? []) {
        postRoutes.push({
          url: `${BASE}/blog/${slug}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    } catch (err) {
      console.error('[sitemap] blog posts fetch failed:', err)
    }
  }

  return [...staticRoutes, ...treatmentRoutes, ...productRoutes, ...postRoutes]
}
