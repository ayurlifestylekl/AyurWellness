'use client'

/**
 * Embedded Sanity Studio route — mounts the studio at /studio inside the
 * Next.js app. The catch-all `[[...tool]]` segment lets the studio handle
 * its own internal routing (Vision, structure, etc.).
 *
 * The studio is a client-only React app, so this file uses `'use client'`
 * and the metadata/viewport exports live in a sibling layout.
 *
 * Docs: https://www.sanity.io/docs/sanity-studio-with-next-js-app-router
 */

import { NextStudio } from 'next-sanity/studio'

import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
