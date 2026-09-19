import type { LucideIcon } from 'lucide-react'
import type { Dosha } from './quiz'

export interface TrustItem {
  id: string
  title: string
  subtitle: string
  icon: LucideIcon
}

export interface Category {
  slug: string
  label: string
  icon: LucideIcon
  image: string
  href: string
}

export interface Therapy {
  slug: string
  name: string
  tagline: string
  durationMin: number
  priceRm: number
  image: string
  bullets: [string, string, string]
  /** Doshas this therapy balances. Used by the quiz recommendation engine. */
  doshas?: Dosha[]
  /** Free-form use cases (e.g. "joint-pain", "stress", "sleep") for symptom-driven matching. */
  useCases?: string[]
  /** Pre-visit checklist shown on the Appointments page hero. 3–5 short bullets. */
  preVisit?: string[]
}

export type PromoAccent = 'primary' | 'accent' | 'secondary'

export interface PromoBanner {
  id: string
  headline: string
  sub: string
  icon: LucideIcon
  accent: PromoAccent
}

export type ProductBadge = 'NEW' | 'BESTSELLER' | 'SALE' | 'COMBO'

export interface FeaturedProduct {
  id: string
  name: string
  tagline: string
  category: string
  priceRm: number
  oldPriceRm?: number
  badge?: ProductBadge
  image: string
  description?: string
}

export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  priceRm: number
  oldPriceRm?: number
  badge?: ProductBadge
  image: string
  sku: string
  stockQty: number
  isBundle: boolean
  createdAt: string
  /** Optional — shown in "Prepared with" section on the detail page. */
  ingredients?: string[]
  /** Optional — shown as a small italic paragraph in "Dose / use". */
  dose?: string
  /** Doshas this product balances. Used by the quiz recommendation engine. */
  doshas?: Dosha[]
  /** Free-form use cases for symptom-driven matching. */
  useCases?: string[]
}
