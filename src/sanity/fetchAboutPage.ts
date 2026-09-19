import { sanityClient } from './client'
import { isSanityConfigured } from './env'
import { ABOUT_PAGE_QUERY } from './queries'

/**
 * Content contract consumed by the About page components. Every field is
 * optional — when a field is missing, the component falls back to its
 * hard-coded copy. This lets editors update a single headline or add a
 * stat without filling out the whole singleton.
 */
export interface AboutPageContent {
  heroEyebrow?: string
  heroHeadlineLead?: string
  heroHeadlineAccent?: string
  heroSubheading?: string
  heroStats?: Array<{ value: string; label: string }>

  founderEyebrow?: string
  founderHeadlineLead?: string
  founderHeadlineAccent?: string
  founderParagraphs?: string[]
  founderPullQuote?: string
  founderName?: string
  founderRole?: string

  commitmentEyebrow?: string
  commitmentHeadlineLead?: string
  commitmentHeadlineAccent?: string
  commitmentBody?: string
  commitmentClosingLine?: string
  commitmentPrimaryLabel?: string
  commitmentPrimaryHref?: string
  commitmentSecondaryLabel?: string
  commitmentSecondaryHref?: string
  commitmentTrustPills?: string[]
}

/**
 * Load the About singleton from Sanity. Returns `null` on any error or
 * when the project isn't configured — components treat null as "use
 * hard-coded copy".
 */
export async function fetchAboutPage(): Promise<AboutPageContent | null> {
  if (!isSanityConfigured) return null
  try {
    const doc = await sanityClient.fetch<AboutPageContent | null>(ABOUT_PAGE_QUERY)
    return doc ?? null
  } catch (err) {
    console.error('[aboutPage] Sanity fetch failed:', err)
    return null
  }
}
