/**
 * One-off batch upload for the Massage Therapies photo set the client
 * supplied (Documents/Ayurvedic Images ). Six treatments got two photos
 * each ("plain" + "(half)") — for those, the plain photo becomes the hero
 * and BOTH photos go into the gallery, where they render side by side
 * (TherapyGallery's existing 2-up grid) — a half-half layout with zero
 * code changes. The other six treatments just get their single photo as hero.
 *
 * Run: `npx tsx scripts/upload-massage-images.ts`
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()
import { createClient } from '@sanity/client'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'
const writeToken = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !writeToken) {
  console.error('Missing SANITY env. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token: writeToken, useCdn: false })

const IMG_DIR = '/Users/sanjaygunabalan2626gmail.com/Documents/Ayurvedic Images '

interface SingleEntry {
  docId: string
  title: string
  file: string
}
interface PairedEntry {
  docId: string
  title: string
  main: string
  half: string
}

const SINGLE: SingleEntry[] = [
  { docId: 'A0WvRqhCuHovKpG5xLdSjJ', title: 'Paada-Abhyangam (Foot Massage)', file: 'Paada-Abhyangam (Foot Massage) .jpg' },
  { docId: 'A0WvRqhCuHovKpG5xLdTeb', title: 'Head Massage', file: 'Head Massage.jpg' },
  { docId: 'A0WvRqhCuHovKpG5xLdoz3', title: 'Lymphatic Drainage Massage', file: 'Lymphatic Drainage Massage .jpeg' },
  { docId: 'AWfwXjO4HDxPM8BN2KA012', title: 'Abhyangam (Full Body Oil Massage)', file: 'Abhyangam (Full Body Oil Massage) .jpg' },
  { docId: 'C0j8n6LymGuEqqIjkVP9rn', title: 'Leg and Foot Massage', file: 'Leg and Foot Massage with Kizhi .jpg' },
  { docId: 'C0j8n6LymGuEqqIjkVPAzC', title: 'Siro-Abhyangam (Head Massage)', file: 'Siro-Abhyangam (Head Massage) .jpg' },
]

const PAIRED: PairedEntry[] = [
  { docId: 'A0WvRqhCuHovKpG5xLdgfR', title: 'Neck and Shoulder Massage with Heat', main: 'Neck and Shoulder Massage with Kizhi .jpg', half: 'Neck and Shoulder Massage with Kizhi(half) .jpg' },
  { docId: 'A0WvRqhCuHovKpG5xLdodZ', title: 'Low-Back & Leg Massage with Heat', main: 'Low-Back & Leg Massage with Kizhi .png', half: 'Low-Back & Leg Massage with Kizhi (half).jpg' },
  { docId: 'A0WvRqhCuHovKpG5xLdpwj', title: 'Abhyangam with Kashaya Dhaara', main: 'Abhyangam with Kashaya Dhaara .jpg', half: 'Abhyangam with Kashaya Dhaara (half).jpg' },
  { docId: 'AWfwXjO4HDxPM8BN2K9yya', title: 'Spinal Massage with Kizhi', main: 'Spinal Massage with Kizhi .webp', half: 'Spinal Massage with Kizhi (half).jpg' },
  { docId: 'AWfwXjO4HDxPM8BN2KA06G', title: 'Abhyangam with Kizhi', main: 'Abhyangam with Kizhi .jpg', half: 'Abhyangam with Kizhi (half).jpg' },
  { docId: 'AWfwXjO4HDxPM8BN2KA15E', title: 'Abhyangam with Steam Bath', main: 'Abhyangam with Steam Bath .webp', half: 'Abhyangam with Steam Bath (half).jpeg' },
]

function contentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'jpeg' || ext === 'jpg') return 'image/jpeg'
  return 'application/octet-stream'
}

async function uploadOne(filename: string) {
  const path = join(IMG_DIR, filename)
  if (!existsSync(path)) throw new Error(`file missing: ${path}`)
  return client.assets.upload('image', createReadStream(path), {
    filename: filename.trim(),
    contentType: contentType(filename),
  })
}

function imageField(assetId: string, alt: string) {
  return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: assetId }, alt }
}

async function main() {
  let ok = 0
  let fail = 0

  for (const e of SINGLE) {
    try {
      const asset = await uploadOne(e.file)
      await client.patch(e.docId).set({ heroImage: imageField(asset._id, e.title) }).commit()
      console.log(`  ✓ ${e.title} → heroImage (${asset._id})`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${e.title}:`, (err as Error).message)
      fail++
    }
  }

  for (const e of PAIRED) {
    try {
      const mainAsset = await uploadOne(e.main)
      const halfAsset = await uploadOne(e.half)
      await client
        .patch(e.docId)
        .set({
          heroImage: imageField(mainAsset._id, e.title),
          gallery: [imageField(mainAsset._id, e.title), imageField(halfAsset._id, `${e.title} (alternate view)`)],
        })
        .commit()
      console.log(`  ✓ ${e.title} → heroImage + gallery (${mainAsset._id}, ${halfAsset._id})`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${e.title}:`, (err as Error).message)
      fail++
    }
  }

  console.log(`\nDone — ${ok} treatments updated, ${fail} failed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
