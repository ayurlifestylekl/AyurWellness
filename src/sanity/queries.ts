import { groq } from 'next-sanity'

/**
 * Returns all treatment categories sorted by their explicit `order` field.
 * Falls back to alphabetical for any category missing an order.
 */
export const TREATMENT_CATEGORIES_QUERY = groq`
  *[_type == "treatmentCategory"] | order(order asc, title asc) {
    _id,
    title,
    order
  }
`

/**
 * Returns all treatments with category info flattened in for easy filtering
 * on the client without a second round-trip.
 */
export const TREATMENTS_QUERY = groq`
  *[_type == "treatment"] | order(category->order asc, title asc) {
    _id,
    title,
    duration,
    description,
    requiresConsultation,
    price,
    priceLabel,
    bookingType,
    bookingLeadTimeHours,
    "categoryId":    category->_id,
    "categoryTitle": category->title,
    "categoryOrder": category->order
  }
`

/* ──────────────────────────────────────────────────────────────────────
 * Treatments — Level 1: categories index with treatment counts
 * ────────────────────────────────────────────────────────────────────── */
export const TREATMENT_CATEGORIES_INDEX_QUERY = groq`
  *[_type == "treatmentCategory" && defined(slug.current)]
    | order(coalesce(order, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      order,
      "treatmentCount": count(*[_type == "treatment" && references(^._id)])
    }
`

/* ──────────────────────────────────────────────────────────────────────
 * Treatments — Level 2: category by slug + its treatments
 * ────────────────────────────────────────────────────────────────────── */
export const CATEGORY_BY_SLUG_QUERY = groq`
  *[_type == "treatmentCategory" && slug.current == $slug][0] {
    _id, title, description, image, order,
    "slug": slug.current,
    "treatments": *[_type == "treatment" && references(^._id) && defined(slug.current)]
      | order(coalesce(order, 9999) asc, title asc) {
        _id, title, duration, description, requiresConsultation, order,
        price, priceLabel, bookingType, bookingLeadTimeHours,
        "slug": slug.current,
        heroImage
      }
  }
`

/* ──────────────────────────────────────────────────────────────────────
 * Treatments — Level 3: single treatment by category+treatment slug
 * ────────────────────────────────────────────────────────────────────── */
export const TREATMENT_BY_SLUG_QUERY = groq`
  *[_type == "treatment" && slug.current == $treatmentSlug
      && category->slug.current == $categorySlug][0] {
    _id, title, duration, description, body, benefits,
    procedureSteps, sessionsRecommended, contraindications,
    origin, sanskritName, requiresConsultation, order,
    price, priceLabel, bookingType, bookingLeadTimeHours,
    "slug": slug.current,
    heroImage, gallery,
    category->{
      _id, title, order,
      "slug": slug.current
    }
  }
`

/**
 * Siblings of a treatment within its category. Used by:
 *  - the switcher (needs _id, title, slug)
 *  - the prev/next pager (needs same)
 *  - the related-therapies grid (needs duration + heroImage too)
 *
 * Includes the current treatment — caller filters it out when needed.
 */
export const TREATMENT_SIBLINGS_QUERY = groq`
  *[_type == "treatment" && category._ref == $categoryId && defined(slug.current)]
    | order(coalesce(order, 9999) asc, title asc) {
      _id, title, order, duration, price, priceLabel, bookingType,
      "slug": slug.current,
      "categorySlug": category->slug.current,
      heroImage
    }
`

/* ──────────────────────────────────────────────────────────────────────
 * Treatments — static params for prerendering
 * ────────────────────────────────────────────────────────────────────── */
export const CATEGORY_SLUGS_QUERY = groq`
  *[_type == "treatmentCategory" && defined(slug.current)][].slug.current
`

export const TREATMENT_SLUG_PAIRS_QUERY = groq`
  *[_type == "treatment" && defined(slug.current) && defined(category->slug.current)] {
    "categorySlug": category->slug.current,
    "treatmentSlug": slug.current
  }
`

/* ──────────────────────────────────────────────────────────────────────
 * Journal (blog) queries
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Listing page projection — lightweight, no body.
 * Sorted newest-first.
 */
export const POSTS_INDEX_QUERY = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug":         slug.current,
    excerpt,
    publishedAt,
    "heroImageUrl": heroImage.asset->url,
    "authorName":   author->name,
    tags
  }
`

/**
 * Single-post projection used by /blog/[slug] — full body + author.
 * Returns null if no post matches the slug.
 */
export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug":         slug.current,
    excerpt,
    publishedAt,
    "heroImageUrl": heroImage.asset->url,
    "heroImageAlt": heroImage.alt,
    body,
    tags,
    readingTimeMinutes,
    author->{
      _id,
      name,
      "slug":     slug.current,
      role,
      bio,
      "imageUrl": image.asset->url
    }
  }
`

/**
 * Just the slugs — used by `generateStaticParams` so Next.js can pre-render
 * every post at build time.
 */
export const POST_SLUGS_QUERY = groq`
  *[_type == "post" && defined(slug.current)][].slug.current
`

/**
 * Three most-recent posts excluding the one currently being read.
 * Used by the "Continue reading" footer on the detail page.
 */
export const RELATED_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current) && _id != $currentId]
    | order(publishedAt desc)[0...3] {
    _id,
    title,
    "slug":         slug.current,
    excerpt,
    publishedAt,
    "heroImageUrl": heroImage.asset->url,
    "authorName":   author->name,
    tags
  }
`

/* ──────────────────────────────────────────────────────────────────────
 * FAQ queries
 * ────────────────────────────────────────────────────────────────────── */

/**
 * All FAQs for a given surface (home | contact | about), ordered by the
 * editor-defined `order` field and then alphabetically as a tiebreak.
 * `surface` is bound as a query parameter, not string-interpolated.
 */
export const FAQS_BY_SURFACE_QUERY = groq`
  *[_type == "faq" && surface == $surface] | order(
    coalesce(order, 9999) asc,
    question asc
  ) {
    _id,
    question,
    answer,
    surface,
    "categoryTitle": category->title
  }
`

/* ──────────────────────────────────────────────────────────────────────
 * About page singleton
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Returns the single aboutPage document (or null if not yet seeded).
 * The page renders hard-coded fallback copy when this returns null.
 */
export const ABOUT_PAGE_QUERY = groq`
  *[_type == "aboutPage"][0] {
    heroEyebrow,
    heroHeadlineLead,
    heroHeadlineAccent,
    heroSubheading,
    heroStats[] { value, label },
    founderEyebrow,
    founderHeadlineLead,
    founderHeadlineAccent,
    founderParagraphs,
    founderPullQuote,
    founderName,
    founderRole,
    commitmentEyebrow,
    commitmentHeadlineLead,
    commitmentHeadlineAccent,
    commitmentBody,
    commitmentClosingLine,
    commitmentPrimaryLabel,
    commitmentPrimaryHref,
    commitmentSecondaryLabel,
    commitmentSecondaryHref,
    commitmentTrustPills
  }
`
