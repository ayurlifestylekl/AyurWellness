import createImageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

import { dataset, projectId } from './env'

const builder = createImageUrlBuilder({ projectId, dataset })

/**
 * Build a CDN URL for a Sanity image asset.
 * Usage: `urlForImage(treatment.heroImage).width(800).height(600).url()`
 */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}
