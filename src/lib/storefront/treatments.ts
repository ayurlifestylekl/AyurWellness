/**
 * Storefront treatment-catalogue reads. Source of truth for the public
 * /treatments pages and the booking treatment picker. Backed by the
 * Supabase `treatments` + `treatment_categories` tables (moved out of
 * Sanity). Shapes returned match the existing `@/types/treatments`
 * interfaces so the page components are unchanged.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PortableTextBlock } from '@portabletext/types'
import type {
  BookingType,
  GalleryImageRef,
  Treatment,
  TreatmentCategory,
  TreatmentDetail,
  TreatmentSibling,
  TreatmentSummary,
} from '@/types/treatments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

const TREATMENT_COLUMNS =
  `id, category_id, title, slug, duration, description, price_rm, price_label,
   booking_type, booking_lead_time_hours, requires_consultation,
   requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags,
   sessions_recommended, sanskrit_name, origin, benefits, procedure_steps,
   contraindications, body, hero_image_url, gallery, sort_order, is_active`

const CATEGORY_COLUMNS = `id, title, slug, description, image_url, sort_order`

/* ── row → type mappers ──────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pricing(r: any) {
  return {
    price: r.price_rm != null ? Number(r.price_rm) : null,
    priceLabel: r.price_label ?? null,
    bookingType: (r.booking_type ?? 'direct') as BookingType,
    bookingLeadTimeHours: r.booking_lead_time_hours ?? null,
    requiresScalpDisclaimer: r.requires_scalp_disclaimer ?? false,
    requiresHealthIntake: r.requires_health_intake ?? false,
    minimumAge: r.minimum_age ?? null,
    specialTags: Array.isArray(r.special_tags) ? r.special_tags : [],
  }
}

/** Plain-text body (paragraphs separated by blank lines) → Portable Text blocks. */
function bodyToPortableText(body: string | null): PortableTextBlock[] | null {
  if (!body) return null
  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (paragraphs.length === 0) return null
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `body-${i}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `body-${i}-0`, text, marks: [] }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSummary(r: any): TreatmentSummary {
  return {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    duration: r.duration ?? null,
    description: r.description ?? null,
    heroImage: null,
    heroImageUrl: r.hero_image_url ?? null,
    requiresConsultation: r.requires_consultation ?? false,
    order: r.sort_order ?? null,
    ...pricing(r),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSibling(r: any, categorySlug: string): TreatmentSibling {
  return {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    categorySlug,
    order: r.sort_order ?? null,
    duration: r.duration ?? null,
    heroImage: null,
    heroImageUrl: r.hero_image_url ?? null,
    ...pricing(r),
  }
}

/* ── queries ─────────────────────────────────────────────────── */

/** Category index with treatment counts, ordered. */
export async function getTreatmentCategoriesIndex(
  sb: SB,
): Promise<TreatmentCategory[]> {
  const [{ data: cats, error: catErr }, { data: treats, error: tErr }] =
    await Promise.all([
      sb.from('treatment_categories').select(CATEGORY_COLUMNS).order('sort_order', { ascending: true }),
      sb.from('treatments').select('category_id').eq('is_active', true),
    ])

  if (catErr || tErr) {
    console.error('[storefront/treatments] index failed:', catErr?.message ?? tErr?.message)
    return []
  }

  const counts = new Map<string, number>()
  for (const t of treats ?? []) {
    counts.set(t.category_id, (counts.get(t.category_id) ?? 0) + 1)
  }

  return (cats ?? []).map((c) => ({
    _id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description ?? null,
    image: null,
    imageUrl: c.image_url ?? null,
    order: c.sort_order ?? null,
    treatmentCount: counts.get(c.id) ?? 0,
  }))
}

/** A category by slug plus its active treatments. */
export async function getCategoryWithTreatments(
  sb: SB,
  slug: string,
): Promise<(TreatmentCategory & { treatments: TreatmentSummary[] }) | null> {
  const { data: cat, error: catErr } = await sb
    .from('treatment_categories')
    .select(CATEGORY_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (catErr || !cat) {
    if (catErr) console.error('[storefront/treatments] category failed:', catErr.message)
    return null
  }

  const { data: treats } = await sb
    .from('treatments')
    .select(TREATMENT_COLUMNS)
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return {
    _id: cat.id,
    title: cat.title,
    slug: cat.slug,
    description: cat.description ?? null,
    image: null,
    order: cat.sort_order ?? null,
    treatments: (treats ?? []).map(rowToSummary),
  }
}

/** A single treatment by category + treatment slug. */
export async function getTreatmentBySlug(
  sb: SB,
  categorySlug: string,
  treatmentSlug: string,
): Promise<TreatmentDetail | null> {
  const { data: cat } = await sb
    .from('treatment_categories')
    .select(CATEGORY_COLUMNS)
    .eq('slug', categorySlug)
    .maybeSingle()
  if (!cat) return null

  const { data: r, error } = await sb
    .from('treatments')
    .select(TREATMENT_COLUMNS)
    .eq('category_id', cat.id)
    .eq('slug', treatmentSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) console.error('[storefront/treatments] detail failed:', error.message)
  if (!r) return null

  return {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    duration: r.duration ?? null,
    description: r.description ?? null,
    body: bodyToPortableText(r.body ?? null),
    benefits: Array.isArray(r.benefits) ? r.benefits : null,
    procedureSteps: Array.isArray(r.procedure_steps) ? r.procedure_steps : null,
    sessionsRecommended: r.sessions_recommended ?? null,
    contraindications: r.contraindications ?? null,
    origin: r.origin ?? null,
    sanskritName: r.sanskrit_name ?? null,
    requiresConsultation: r.requires_consultation ?? false,
    heroImage: null,
    heroImageUrl: r.hero_image_url ?? null,
    gallery: Array.isArray(r.gallery)
      ? (r.gallery as GalleryImageRef[]).filter((img) => img?.url !== r.hero_image_url)
      : null,
    order: r.sort_order ?? null,
    ...pricing(r),
    category: {
      _id: cat.id,
      title: cat.title,
      slug: cat.slug,
      order: cat.sort_order ?? null,
    },
  }
}

/** Siblings within a category (includes the current treatment). */
export async function getTreatmentSiblings(
  sb: SB,
  categoryId: string,
): Promise<TreatmentSibling[]> {
  const { data: cat } = await sb
    .from('treatment_categories')
    .select('slug')
    .eq('id', categoryId)
    .maybeSingle()
  const categorySlug = cat?.slug ?? ''

  const { data, error } = await sb
    .from('treatments')
    .select(TREATMENT_COLUMNS)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[storefront/treatments] siblings failed:', error.message)
    return []
  }
  return (data ?? []).map((r) => rowToSibling(r, categorySlug))
}

/**
 * Flat treatment list (with category info inlined) for the booking picker.
 * Mirrors the legacy Sanity TREATMENTS_QUERY shape.
 */
export async function getTreatmentsFlat(sb: SB): Promise<Treatment[]> {
  const { data, error } = await sb
    .from('treatments')
    .select(`${TREATMENT_COLUMNS}, treatment_categories(id, title, sort_order)`)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    if (error) console.error('[storefront/treatments] flat failed:', error.message)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    _id: r.id,
    title: r.title,
    duration: r.duration ?? null,
    description: r.description ?? null,
    requiresConsultation: r.requires_consultation ?? false,
    categoryId: r.category_id,
    categoryTitle: r.treatment_categories?.title ?? '',
    categoryOrder: r.treatment_categories?.sort_order ?? null,
    imageUrl: r.hero_image_url ?? null,
    ...pricing(r),
  }))
}

/** All (categorySlug, treatmentSlug) pairs for static params. */
export async function getTreatmentSlugPairs(
  sb: SB,
): Promise<Array<{ categorySlug: string; treatmentSlug: string }>> {
  const { data, error } = await sb
    .from('treatments')
    .select('slug, treatment_categories(slug)')
    .eq('is_active', true)
  if (error || !data) return []
  return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({
      categorySlug: r.treatment_categories?.slug,
      treatmentSlug: r.slug,
    }))
    .filter((p) => p.categorySlug && p.treatmentSlug)
}
