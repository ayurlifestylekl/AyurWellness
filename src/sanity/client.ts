import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, readToken } from './env'

type Client = ReturnType<typeof createClient>

/**
 * Server-side Sanity client for Next.js Server Components and Route Handlers.
 * `useCdn: false` ensures we always read fresh data; ISR is handled at the
 * page level via `export const revalidate`.
 *
 * Constructed lazily on first use. `createClient` throws synchronously when
 * `projectId` is empty, so building it at module scope crashed `next build`
 * on any deploy without Sanity env vars set — the import alone was enough to
 * fail the whole route (see env.ts, which intentionally falls back to '').
 * Deferring construction keeps the failure at fetch time, where every call
 * site already has a try/catch and degrades to its fallback content.
 */
let cached: Client | null = null

function getClient(): Client {
  if (!cached) {
    cached = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: readToken,
      perspective: 'published',
    })
  }
  return cached
}

export const sanityClient = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
