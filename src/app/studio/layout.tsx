import type { Metadata, Viewport } from 'next'

/**
 * Layout for the embedded Sanity Studio. Sanity ships its own viewport and
 * meta tag recommendations through `next-sanity/studio` — we re-export them
 * here so the studio renders correctly on mobile and full-height desktop.
 */
export { metadata, viewport } from 'next-sanity/studio'

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen w-full">{children}</div>
}

// Type re-export for clarity in tooling
export type { Metadata, Viewport }
