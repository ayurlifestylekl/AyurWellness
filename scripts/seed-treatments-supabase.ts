/**
 * Seed the Supabase treatment catalogue (treatment_categories + treatments)
 * from scripts/seed-data/treatments-seed.json.
 *
 * Usage:
 *   1. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY (service role bypasses RLS).
 *   2. From the ayurvedic/ directory:
 *        npx tsx scripts/seed-treatments-supabase.ts
 *
 * Behaviour:
 *   - Categories are upserted on `id`.
 *   - Treatments are upserted on the (category_id, slug) unique key, so
 *     re-running is idempotent and edits in the JSON propagate.
 *   - Pass `--reset` to delete all existing treatments + categories first.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Next.js reads .env.local automatically; tsx does not — load it explicitly
// (fall back to .env).
config({ path: '.env.local' })
config()

import seedData from './seed-data/treatments-seed.json'

interface SeedCategory {
  _id: string
  title: string
  order: number
  slug?: string
  imageUrl?: string
  description?: string
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
  price?: number
  priceLabel?: string
  bookingType?: string
  bookingLeadTimeHours?: number
  sessionsRecommended?: string
  sanskritName?: string
  origin?: string
  benefits?: string[]
  procedureSteps?: SeedProcedureStep[]
  contraindications?: string
  body?: string[]
  order?: number
  slug?: string
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    '[seed-supabase] Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function categorySlug(cat: SeedCategory): string {
  return cat.slug ?? cat._id.replace(/^cat-/, '')
}

async function run() {
  const reset = process.argv.includes('--reset')
  const { categories, treatments } = seedData as {
    categories: SeedCategory[]
    treatments: SeedTreatment[]
  }

  if (reset) {
    console.log('[seed-supabase] --reset: deleting existing treatments + categories…')
    await supabase.from('treatments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('treatment_categories').delete().neq('id', '__none__')
  }

  console.log(`[seed-supabase] Upserting ${categories.length} categories…`)
  const catRows = categories.map((c) => ({
    id: c._id,
    title: c.title,
    slug: categorySlug(c),
    sort_order: c.order,
    image_url: c.imageUrl ?? null,
    description: c.description ?? null,
  }))
  const { error: catErr } = await supabase
    .from('treatment_categories')
    .upsert(catRows, { onConflict: 'id' })
  if (catErr) {
    console.error('[seed-supabase] category upsert failed:', catErr.message)
    process.exit(1)
  }

  // per-category running index for default ordering
  const orderCounter = new Map<string, number>()

  const treatmentRows = treatments.map((t) => {
    const idx = orderCounter.get(t.categoryRef) ?? 0
    orderCounter.set(t.categoryRef, idx + 1)
    return {
      category_id: t.categoryRef,
      title: t.title,
      slug: t.slug ?? slugify(t.title),
      duration: t.duration ?? null,
      description: t.description ?? null,
      price_rm: typeof t.price === 'number' ? t.price : null,
      price_label: t.priceLabel ?? null,
      booking_type: t.bookingType ?? 'direct',
      booking_lead_time_hours: t.bookingLeadTimeHours ?? null,
      requires_consultation: t.requiresConsultation ?? t.bookingType === 'consultation',
      sessions_recommended: t.sessionsRecommended ?? null,
      sanskrit_name: t.sanskritName ?? null,
      origin: t.origin ?? null,
      benefits: t.benefits ?? null,
      procedure_steps: t.procedureSteps ?? null,
      contraindications: t.contraindications ?? null,
      body: t.body && t.body.length > 0 ? t.body.join('\n\n') : null,
      sort_order: t.order ?? idx,
      is_active: true,
    }
  })

  console.log(`[seed-supabase] Upserting ${treatmentRows.length} treatments…`)
  const { error: tErr } = await supabase
    .from('treatments')
    .upsert(treatmentRows, { onConflict: 'category_id,slug' })
  if (tErr) {
    console.error('[seed-supabase] treatment upsert failed:', tErr.message)
    process.exit(1)
  }

  console.log(
    `[seed-supabase] Done — ${catRows.length} categories and ${treatmentRows.length} treatments.`,
  )
}

run().catch((err) => {
  console.error('[seed-supabase] Failed:', err)
  process.exit(1)
})
