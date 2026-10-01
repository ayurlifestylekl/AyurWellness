import { describe, expect, it, vi } from 'vitest'

// Sanity isn't connected on this site; the blog part of the sitemap must simply be empty.
vi.mock('@/sanity/client', () => ({ sanityClient: { fetch: vi.fn() } }))
vi.mock('@/sanity/env', () => ({ isSanityConfigured: false }))

import sitemap from '../sitemap'
import { getAllCategories, getTreatmentsByCategorySlug } from '@/data/treatments'
import { products } from '@/data/products'

const BASE = 'https://ayurvedawellness.com.my'

describe('sitemap', () => {
  it('lists every therapy and category page, from the same data the pages are built from', async () => {
    const urls = new Set((await sitemap()).map((e) => e.url))
    let therapies = 0
    for (const c of getAllCategories()) {
      expect(urls.has(`${BASE}/treatments/${c.slug}`)).toBe(true)
      for (const t of getTreatmentsByCategorySlug(c.slug)) {
        therapies++
        expect(urls.has(`${BASE}/treatments/${c.slug}/${t.slug}`)).toBe(true)
      }
    }
    expect(therapies).toBeGreaterThan(50)
  })

  it('lists every product page', async () => {
    const urls = new Set((await sitemap()).map((e) => e.url))
    for (const p of products) expect(urls.has(`${BASE}/products/${p.id}`)).toBe(true)
  })

  it('includes the legal pages and the free-consultation booking page', async () => {
    const urls = new Set((await sitemap()).map((e) => e.url))
    for (const path of ['/privacy', '/terms', '/cancellation', '/book/consultation', '/products', '/blog']) {
      expect(urls.has(`${BASE}${path}`)).toBe(true)
    }
  })

  it('has no duplicate URLs', async () => {
    const list = (await sitemap()).map((e) => e.url)
    expect(new Set(list).size).toBe(list.length)
  })

  it('never advertises private, transactional or staff pages (they are disallowed in robots.txt)', async () => {
    const list = (await sitemap()).map((e) => e.url)
    const forbidden = ['/admin', '/account', '/auth', '/cart', '/checkout', '/api', '/doctor', '/frontdesk', '/studio', '/book/request', '/book/manage', '/book/treatment']
    for (const url of list) {
      for (const f of forbidden) expect(url.startsWith(`${BASE}${f}`)).toBe(false)
    }
  })
})
