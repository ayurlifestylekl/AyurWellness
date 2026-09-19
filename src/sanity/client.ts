import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, readToken } from './env'

/**
 * Server-side Sanity client for Next.js Server Components and Route Handlers.
 * `useCdn: false` ensures we always read fresh data; ISR is handled at the
 * page level via `export const revalidate`.
 */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: readToken,
  perspective: 'published',
})
