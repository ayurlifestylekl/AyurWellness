/**
 * Read a manifest of generated image files and upload each to Sanity, then
 * patch the corresponding document to point at the new image asset.
 *
 * Manifest format (`/tmp/sanity-upload-manifest.json`):
 *   [
 *     { "docId": "cat-face-care", "field": "image",      "file": "/path/img.png", "alt": "Face care therapy" },
 *     { "docId": "<treatment-id>", "field": "heroImage", "file": "/path/img.png", "alt": "Mukhalepam" },
 *     ...
 *   ]
 *
 * Run: `npx tsx scripts/upload-treatment-images.ts`
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()
import { createClient } from '@sanity/client'
import { createReadStream, readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'
const writeToken = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !writeToken) {
  console.error('Missing SANITY env. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN.')
  process.exit(1)
}

const MANIFEST_PATH = process.env.MANIFEST_PATH ?? '/tmp/sanity-upload-manifest.json'

interface ManifestEntry {
  docId: string
  field: 'image' | 'heroImage'
  file: string
  alt: string
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: writeToken,
  useCdn: false,
})

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found: ${MANIFEST_PATH}`)
    process.exit(1)
  }
  const manifest: ManifestEntry[] = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  console.log(`Manifest entries: ${manifest.length}`)

  let ok = 0
  let fail = 0
  for (const entry of manifest) {
    try {
      if (!existsSync(entry.file)) {
        console.warn(`  ✗ ${entry.docId} (${entry.field}): file missing → ${entry.file}`)
        fail++
        continue
      }
      const filename = basename(entry.file)
      const asset = await client.assets.upload('image', createReadStream(entry.file), {
        filename,
        contentType: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      })
      await client
        .patch(entry.docId)
        .set({
          [entry.field]: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
            alt: entry.alt,
          },
        })
        .commit()
      console.log(`  ✓ ${entry.docId} (${entry.field}) → ${asset._id}`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${entry.docId} (${entry.field}):`, (err as Error).message)
      fail++
    }
  }
  console.log(`\nDone — ${ok} uploaded, ${fail} failed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
