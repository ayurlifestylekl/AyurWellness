import type { PortableTextBlock } from '@portabletext/types'

export interface SanityImageRef {
  _type?: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  alt?: string
}

export interface ProcedureStep {
  title: string
  description: string
}

/** One photo in a treatment's gallery — stored as plain Supabase Storage URLs. */
export interface GalleryImageRef {
  url: string
  alt?: string | null
}

export type BookingType = 'direct' | 'consultation' | 'enquiry'

/** Pricing/booking fields shared across summary and detail projections. */
export interface TreatmentPricing {
  /** Numeric price in RM, or null for consultation/enquiry-only therapies. */
  price?: number | null
  /** Display override shown instead of the numeric price. */
  priceLabel?: string | null
  bookingType?: BookingType | null
  /** Minimum advance notice in hours (24, 48, …). */
  bookingLeadTimeHours?: number | null
  /** True when the customer must confirm they have no dandruff or scalp issues. */
  requiresScalpDisclaimer?: boolean
  /** True when the expanded health-intake section is mandatory. */
  requiresHealthIntake?: boolean
  /** Minimum patient age (years) for direct online booking. NULL means no gate. */
  minimumAge?: number | null
  /** Internal tags used to group therapies (e.g. oldage, kids, shirodhara). */
  specialTags?: string[]
}

export interface TreatmentCategory {
  _id: string
  title: string
  /** Optional because the legacy TREATMENT_CATEGORIES_QUERY (booking flow) doesn't project this. New queries always do. */
  slug?: string
  description?: string | null
  image?: SanityImageRef | null
  /** Plain image URL (Supabase catalogue). Preferred over `image` when present. */
  imageUrl?: string | null
  order: number | null
  treatmentCount?: number
}

export interface TreatmentSummary extends TreatmentPricing {
  _id: string
  title: string
  slug: string
  duration: string | null
  description: string | null
  heroImage: SanityImageRef | null
  /** Plain image URL (Supabase catalogue). Preferred over `heroImage` when present. */
  heroImageUrl?: string | null
  requiresConsultation: boolean
  order: number | null
}

export interface TreatmentDetail extends TreatmentPricing {
  _id: string
  title: string
  slug: string
  duration: string | null
  description: string | null
  body: PortableTextBlock[] | null
  benefits: string[] | null
  procedureSteps: ProcedureStep[] | null
  sessionsRecommended: string | null
  contraindications: string | null
  origin: string | null
  sanskritName: string | null
  requiresConsultation: boolean
  heroImage: SanityImageRef | null
  /** Plain image URL (Supabase catalogue). Preferred over `heroImage` when present. */
  heroImageUrl?: string | null
  gallery: GalleryImageRef[] | null
  order: number | null
  category: {
    _id: string
    title: string
    slug: string
    order: number | null
  }
}

export interface TreatmentSibling extends TreatmentPricing {
  _id: string
  title: string
  slug: string
  categorySlug: string
  order: number | null
  duration: string | null
  heroImage: SanityImageRef | null
  /** Plain image URL (Supabase catalogue). Preferred over `heroImage` when present. */
  heroImageUrl?: string | null
}

/**
 * Back-compat for the existing TREATMENTS_QUERY shape consumed by
 * the legacy TreatmentsMenu. Once Task 31 deletes the menu, this
 * type and the legacy query can be removed.
 */
export interface Treatment extends TreatmentPricing {
  _id: string
  title: string
  duration: string | null
  description: string | null
  requiresConsultation: boolean
  categoryId: string
  categoryTitle: string
  categoryOrder: number | null
  /** Hero photo for this specific treatment (Supabase Storage URL). */
  imageUrl?: string | null
}
