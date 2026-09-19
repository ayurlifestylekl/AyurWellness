/**
 * One-shot Sanity seed script for Treatments + Treatment Categories.
 *
 * Usage:
 *   1. Make sure .env.local has NEXT_PUBLIC_SANITY_PROJECT_ID,
 *      NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN.
 *   2. From the ayurvedic/ directory, run:
 *        npx tsx scripts/seed-treatments.ts --reset
 *
 * Behaviour:
 *   - Categories use stable `_id`s and are upserted with `createOrReplace`,
 *     so re-running the script is idempotent for categories. Each category
 *     gets a slug derived from its `_id` (cat-foo -> foo) unless an explicit
 *     `slug` is provided.
 *   - Treatments are CREATED on each run with a deterministic `_id` of
 *     `treatment-<categorySlug>-<titleSlug>` so re-running with --reset is
 *     clean and stable. To wipe-and-reseed, run with the `--reset` flag,
 *     which first deletes every existing treatment.
 *   - Every field present on a seed treatment is written. `body` may be
 *     supplied as an array of paragraph strings; each becomes a Portable
 *     Text block. `order` is taken from the seed when present, otherwise
 *     the treatment's index within its category.
 */

import 'dotenv/config'
import { createClient } from '@sanity/client'

import seedData from './seed-data/treatments-seed.json'

interface SeedCategory {
  _id: string
  title: string
  order: number
  slug?: string
}

interface SeedProcedureStep {
  title: string
  description: string
}

interface SeedTreatment {
  title: string
  categoryRef: string
  duration?: string
  description?: string
  requiresConsultation?: boolean
  /** Numeric price in RM. Omit for consultation/enquiry-only therapies. */
  price?: number
  /** Display override shown instead of the numeric price. */
  priceLabel?: string
  /** 'direct' | 'consultation' | 'enquiry' */
  bookingType?: string
  /** Minimum advance notice in hours (24, 48, …). */
  bookingLeadTimeHours?: number
  sessionsRecommended?: string
  sanskritName?: string
  origin?: string
  benefits?: string[]
  procedureSteps?: SeedProcedureStep[]
  contraindications?: string
  /** Long-form overview as an array of paragraph strings. */
  body?: string[]
  /** Explicit display order within the category. */
  order?: number
  /** Slug override; defaults to a slug of the title. */
  slug?: string
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  console.error(
    '[seed] Missing env vars. Need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN in .env.local',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
})

/** kebab-case slug from arbitrary text. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/** cat-foo-bar -> foo-bar */
function categorySlug(cat: SeedCategory): string {
  return cat.slug ?? cat._id.replace(/^cat-/, '')
}

/** Wrap each paragraph string in a minimal Portable Text block. */
function toPortableText(paragraphs: string[] | undefined) {
  if (!paragraphs || paragraphs.length === 0) return undefined
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `body-${i}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `body-${i}-0`, text, marks: [] }],
  }))
}

async function run() {
  const reset = process.argv.includes('--reset')
  const { categories, treatments } = seedData as {
    categories: SeedCategory[]
    treatments: SeedTreatment[]
  }

  if (reset) {
    console.log('[seed] --reset flag set: deleting existing treatments…')
    await client.delete({ query: '*[_type == "treatment"]' })
  }

  const catSlugById = new Map<string, string>()

  console.log(`[seed] Upserting ${categories.length} categories…`)
  for (const cat of categories) {
    const slug = categorySlug(cat)
    catSlugById.set(cat._id, slug)
    await client.createOrReplace({
      _id: cat._id,
      _type: 'treatmentCategory',
      title: cat.title,
      order: cat.order,
      slug: { _type: 'slug', current: slug },
    })
  }

  // Track per-category index for default ordering.
  const orderCounter = new Map<string, number>()

  console.log(`[seed] Creating ${treatments.length} treatments…`)
  for (const t of treatments) {
    const catSlug = catSlugById.get(t.categoryRef) ?? t.categoryRef.replace(/^cat-/, '')
    const titleSlug = t.slug ?? slugify(t.title)
    const idx = orderCounter.get(t.categoryRef) ?? 0
    orderCounter.set(t.categoryRef, idx + 1)

    const doc: Record<string, unknown> = {
      _id: `treatment-${catSlug}-${titleSlug}`,
      _type: 'treatment',
      title: t.title,
      slug: { _type: 'slug', current: titleSlug },
      category: { _type: 'reference', _ref: t.categoryRef },
      order: t.order ?? idx,
      requiresConsultation: t.requiresConsultation ?? t.bookingType === 'consultation',
      bookingType: t.bookingType ?? 'direct',
    }

    if (t.duration !== undefined) doc.duration = t.duration
    if (t.description !== undefined) doc.description = t.description
    if (t.price !== undefined) doc.price = t.price
    if (t.priceLabel !== undefined) doc.priceLabel = t.priceLabel
    if (t.bookingLeadTimeHours !== undefined) doc.bookingLeadTimeHours = t.bookingLeadTimeHours
    if (t.sessionsRecommended !== undefined) doc.sessionsRecommended = t.sessionsRecommended
    if (t.sanskritName !== undefined) doc.sanskritName = t.sanskritName
    if (t.origin !== undefined) doc.origin = t.origin
    if (t.benefits !== undefined) doc.benefits = t.benefits
    if (t.contraindications !== undefined) doc.contraindications = t.contraindications
    if (t.procedureSteps !== undefined) {
      doc.procedureSteps = t.procedureSteps.map((s, i) => ({
        _type: 'object',
        _key: `step-${i}`,
        title: s.title,
        description: s.description,
      }))
    }
    const body = toPortableText(t.body)
    if (body) doc.body = body

    await client.createOrReplace(doc as never)
  }

  console.log(
    `[seed] Done — seeded ${categories.length} categories and ${treatments.length} treatments.`,
  )
}

run().catch((err) => {
  console.error('[seed] Failed:', err)
  process.exit(1)
})
