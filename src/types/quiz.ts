export type Dosha = 'vata' | 'pitta' | 'kapha'

export type DoshaScores = Record<Dosha, number>

export interface QuizOption {
  id: string
  /** Plain-English label shown to the user; never reveals the mapped dosha. */
  label: string
  /** Optional supporting copy (e.g. example or qualifier). */
  hint?: string
  /** The dosha this option contributes a point to when scoring. */
  dosha: Dosha
  /** Optional lucide icon name to render alongside the label. */
  icon?:
    | 'leaf'
    | 'flame'
    | 'mountain'
    | 'droplet'
    | 'sun'
    | 'moon'
    | 'wind'
    | 'sparkle'
    | 'feather'
    | 'gem'
    | 'sprout'
    | 'cloud'
}

export interface QuizQuestion {
  id: string
  prompt: string
  /** Optional subtle helper text under the prompt. */
  helper?: string
  options: QuizOption[]
}

export interface QuizSection {
  id: string
  title: string
  /** Italic Sanskrit term displayed alongside the English title. */
  sanskrit?: string
  intro: string
  questions: QuizQuestion[]
}

/**
 * The 7 possible archetypes a Prakriti quiz can produce. Single-dosha when one
 * dosha is clearly dominant, dual when the top two are close, tridoshic when
 * all three are within a tight band.
 */
export type ArchetypeKey =
  | 'vata'
  | 'pitta'
  | 'kapha'
  | 'vata-pitta'
  | 'vata-kapha'
  | 'pitta-kapha'
  | 'tridoshic'

export interface ArchetypeRecommendation {
  /** Product slug from `src/data/products.ts`. */
  productSlugs?: string[]
  /** Therapy slug from `src/data/therapies.ts`. */
  therapySlugs?: string[]
}

export interface Archetype {
  key: ArchetypeKey
  name: string
  /** Poetic English label, e.g. "The Wanderer". */
  title: string
  sanskrit: string
  /** One-line essence shown in the hero. */
  essence: string
  /** ~150-200 word profile body. */
  profile: string
  heroImage: string
  imageAlt: string
  /** 5 lifestyle anchors customers can adopt today. */
  dailyAnchors: string[]
  /** Short bullets — foods that balance this archetype. */
  foodsThatNourish: string[]
  /** Short bullets — foods to limit. */
  foodsToLimit: string[]
  recommendations: ArchetypeRecommendation
}

export interface PrakritiResult {
  scores: DoshaScores
  /** Total points actually distributed (denominator for percentages). */
  totalPoints: number
  archetypeKey: ArchetypeKey
  /** Always set; for dual / tridoshic this is the most-points dosha. */
  dominantDosha: Dosha
  /** Set for dual archetypes; null for single + tridoshic. */
  secondaryDosha: Dosha | null
}

export interface PrakritiQuizDefinition {
  slug: 'prakriti'
  title: string
  sanskrit: string
  tagline: string
  estimatedMinutes: number
  sections: QuizSection[]
  archetypes: Record<ArchetypeKey, Archetype>
}

/**
 * Persistence shape for the `result_data` JSONB column on `quiz_results`.
 * Mirrors `PrakritiResult` but stable across schema evolution — only add
 * fields, never remove.
 */
export interface QuizResultRow {
  version: 1
  scores: DoshaScores
  totalPoints: number
  archetypeKey: ArchetypeKey
  dominantDosha: Dosha
  secondaryDosha: Dosha | null
}

/**
 * In-progress state persisted to localStorage so the customer can resume
 * a partially-completed quiz.
 */
export interface QuizProgressState {
  slug: 'prakriti'
  /** Maps `question.id` → chosen `option.dosha`. */
  responses: Record<string, Dosha>
  /** Where the player should resume — `'intro'`, a section id, or `'results'`. */
  cursor: string
  updatedAt: string
}
