/**
 * Centralised access to Sanity environment variables.
 *
 * We deliberately fall back to empty strings instead of throwing at module
 * load — that way `next build` and `next dev` keep working even before the
 * user has wired up their Sanity project. The fetch itself will fail loudly
 * at request time if the IDs are missing, which is the right place to fail.
 *
 * The treatments page already wraps fetches in try/catch (see page.tsx),
 * so a missing config degrades gracefully to an empty grid + the Free
 * Consultation banner.
 */

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'

/** Server-only write token. Required by the seed script. */
export const writeToken = process.env.SANITY_API_WRITE_TOKEN

/**
 * Server-only read token. Falls back to the write token when no dedicated
 * read token is configured — the sanityClient is only ever imported from
 * server components and route handlers, so the token is never shipped to
 * the browser.
 */
export const readToken =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN

/** True only when the public project id has actually been configured. */
export const isSanityConfigured = projectId.length > 0
