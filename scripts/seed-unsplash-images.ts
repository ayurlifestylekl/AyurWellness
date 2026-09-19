/**
 * Curated Unsplash photos as placeholder images for every treatmentCategory
 * and treatment that doesn't yet have one. The photos were picked from
 * verified Unsplash searches (ayurveda, ayurveda-massage, shirodhara,
 * spa-face-mask, herbal-medicine, scalp-massage).
 *
 * For each doc:
 *   1. Pick a photo URL from the per-category pool (deterministic).
 *   2. Download it to /tmp.
 *   3. Upload to Sanity assets.
 *   4. Patch the doc's `image` (category) or `heroImage` (treatment) field.
 *
 * Skips any doc that already has the field set.
 *
 * Run: `npx tsx scripts/seed-unsplash-images.ts`
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()

import { createClient } from '@sanity/client'
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'
const writeToken = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !writeToken) {
  console.error('Missing SANITY env. Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN.')
  process.exit(1)
}

const TMP_DIR = '/tmp/treatment-photos'
mkdirSync(TMP_DIR, { recursive: true })

const UNSPLASH_QUERY_SUFFIX = '?fm=jpg&q=80&w=2000&auto=format&fit=crop'
const baseUrl = (id: string) => `https://images.unsplash.com/photo-${id}${UNSPLASH_QUERY_SUFFIX}`

/* ── Photo pools by theme. Each ID was harvested from an Unsplash search ── */
const POOL_AYURVEDA_MASSAGE = [
  '1741522509438-a120c0bb5e88',
  '1544161515-4ab6ce6db874',
  '1591343395082-e120087004b4',
  '1741522509407-41cfe73b0b75',
  '1542848284-8afa78a08ccb',
  '1701917094553-aa3c13f6d16c',
  '1570174006382-148305ce4972',
  '1611920630418-f587fdc3bf94',
  '1728497872660-cc6b16238c3a',
  '1596178060671-7a80dc8059ea',
  '1709755491926-f7aa83748967',
  '1664549760921-2198b054a592',
  '1728497872607-fa0b98a3eb79',
]
const POOL_SHIRODHARA = [
  '1731597076108-f3bbe268162f',
  '1775133263714-848c8fe09e73',
  '1657452921959-4268016fdf13',
  '1571730021167-16f5c4851b3b',
  '1743542498905-b1e32377c513',
  '1769422319849-c4ad944deb56',
  '1701450320883-3563ac4a379b',
  '1741342079488-1ee8e5d0f09e',
  '1668534985087-a01de93f872c',
  '1644749024572-12eb159b8bca',
  '1755010585956-d32a7036ea87',
  '1768738436447-7df62ffa3912',
  '1560447992-466be70a0c49',
  '1731056992072-d2dfeb53a1d3',
  '1644481153470-30cc780841bd',
]
const POOL_FACE_MASK = [
  '1570172619644-dfd03ed5d881',
  '1616394584738-fc6e612e71b9',
  '1531299204812-e6d44d9a185c',
  '1623120594168-a6d35474043b',
  '1731514771613-991a02407132',
  '1664549761426-6a1cb1032854',
  '1516815989420-9cb5ef0fce78',
  '1713824096348-c1956e6da321',
  '1623225088166-eea1cdc9775a',
  '1580680639239-49c20331b0d4',
  '1465400325222-409b0b34be7c',
  '1670201203150-bf8771401590',
  '1670201202794-b589d5d7e9da',
  '1580564591877-3a6578d09f5d',
  '1611169035510-f9af52e6dbe2',
]
const POOL_HERBAL = [
  '1514733670139-4d87a1941d55',
  '1532091710512-26fd3b2dcf16',
  '1545840716-c82e9eec6930',
  '1611073761742-bce90ccd60ae',
  '1532092367580-3bd5bc78dd9d',
  '1517135399940-2855f5be7c4b',
  '1492552085122-36706c238263',
  '1495461199391-8c39ab674295',
  '1506368249639-73a05d6f6488',
  '1581600140682-d4e68c8cde32',
  '1659328376647-52ec39d1a5cf',
  '1532336414038-cf19250c5757',
  '1583466478015-2dce6bf2f551',
  '1504382103100-db7e92322d39',
  '1531932755987-f95a88affea5',
]
const POOL_SCALP = [
  '1515377905703-c4788e51af15',
  '1598901986949-f593ff2a31a6',
  '1595476108010-b4d1f102b1b1',
  '1706795034830-de41aee06afa',
  '1542848285-4777eb2a621e',
  '1717160675158-fdd75b8595cf',
  '1717160676422-155f41965293',
  '1740035680800-d5270855c68d',
  '1613966582880-80a7327b250f',
  '1767953829433-1e405b6889de',
  '1672642150262-6edcbffa463e',
  '1647763769002-189a8d2e40a3',
  '1639195916267-4c5caca21853',
  '1613835230036-fc791b90795a',
]

/* ── Per-category pool selection ─────────────────────────── */
const CATEGORY_POOL: Record<string, string[]> = {
  'face-care-therapies':     POOL_FACE_MASK,
  'massage-therapies':       POOL_AYURVEDA_MASSAGE,
  'stress-relieving-sleep':  POOL_SHIRODHARA,
  'joint-care-therapies':    POOL_AYURVEDA_MASSAGE,
  'skin-care-therapies':     POOL_HERBAL,
  'hair-care-therapies':     POOL_SCALP,
  'weight-management-therapy': POOL_HERBAL,
  'eye-care-therapies':      POOL_HERBAL,
  'nasyam-ear-therapies':    POOL_HERBAL,
  'rehabilitation-therapies':POOL_AYURVEDA_MASSAGE,
  'kids-ayurveda-care':      POOL_AYURVEDA_MASSAGE,
  'oldage-care-therapies':   POOL_AYURVEDA_MASSAGE,
}

/* ── Per-category "hero" photo for the category card itself ── */
const CATEGORY_HERO: Record<string, string> = {
  'face-care-therapies':     '1570172619644-dfd03ed5d881',     // calm face mask
  'massage-therapies':       '1544161515-4ab6ce6db874',         // oil massage
  'stress-relieving-sleep':  '1657452921959-4268016fdf13',     // shirodhara
  'joint-care-therapies':    '1591343395082-e120087004b4',     // joint massage
  'skin-care-therapies':     '1514733670139-4d87a1941d55',     // herbs
  'hair-care-therapies':     '1515377905703-c4788e51af15',     // hair / scalp
  'weight-management-therapy':'1532091710512-26fd3b2dcf16',    // herbal scrub
  'eye-care-therapies':      '1545840716-c82e9eec6930',        // herbs eyedrops feel
  'nasyam-ear-therapies':    '1611073761742-bce90ccd60ae',     // botanical drops
  'rehabilitation-therapies':'1701917094553-aa3c13f6d16c',     // therapy
  'kids-ayurveda-care':      '1611920630418-f587fdc3bf94',     // gentle care
  'oldage-care-therapies':   '1728497872660-cc6b16238c3a',     // calm care
}

/* ── Sanity client ───────────────────────────────────────── */
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: writeToken,
  useCdn: false,
})

interface Cat { _id: string; title: string; slug: string; hasImage: boolean }
interface Tr  { _id: string; title: string; slug: string; category: { title: string; slug: string }; hasImage: boolean }

async function downloadIfNeeded(photoId: string): Promise<string> {
  const localPath = join(TMP_DIR, `${photoId}.jpg`)
  if (existsSync(localPath)) return localPath
  const url = baseUrl(photoId)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`fetch ${photoId} → HTTP ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  writeFileSync(localPath, buf)
  return localPath
}

async function setImage(docId: string, field: 'image' | 'heroImage', photoId: string, alt: string) {
  const localPath = await downloadIfNeeded(photoId)
  const asset = await client.assets.upload('image', createReadStream(localPath), {
    filename: `${photoId}.jpg`,
    contentType: 'image/jpeg',
  })
  await client
    .patch(docId)
    .set({
      [field]: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt,
      },
    })
    .commit()
  return asset._id
}

async function main() {
  // Fetch fresh state — only seed docs that currently lack an image.
  const cats = await client.fetch<Cat[]>(`
    *[_type == "treatmentCategory" && defined(slug.current)]
      | order(coalesce(order, 9999) asc, title asc) {
        _id, title, "slug": slug.current,
        "hasImage": defined(image.asset)
      }
  `)
  const treatments = await client.fetch<Tr[]>(`
    *[_type == "treatment" && defined(slug.current)]
      | order(category->order asc, coalesce(order, 9999) asc, title asc) {
        _id, title, "slug": slug.current,
        "category": category->{ title, "slug": slug.current },
        "hasImage": defined(heroImage.asset)
      }
  `)

  console.log(`Categories: ${cats.length} (${cats.filter(c => !c.hasImage).length} need image)`)
  console.log(`Treatments: ${treatments.length} (${treatments.filter(t => !t.hasImage).length} need image)\n`)

  let ok = 0
  let skip = 0
  let fail = 0

  // 1) Categories
  for (const c of cats) {
    if (c.hasImage) { skip++; continue }
    const photoId = CATEGORY_HERO[c.slug] ?? CATEGORY_POOL[c.slug]?.[0]
    if (!photoId) {
      console.warn(`! no photo mapped for category ${c.slug}`)
      fail++
      continue
    }
    try {
      const assetId = await setImage(c._id, 'image', photoId, `${c.title} — placeholder image`)
      console.log(`  ✓ [cat] ${c.slug} → ${assetId}`)
      ok++
    } catch (err) {
      console.error(`  ✗ [cat] ${c.slug}:`, (err as Error).message)
      fail++
    }
  }

  // 2) Treatments — rotate within the category's pool, indexed by order in fetch
  const treatmentsByCat = new Map<string, Tr[]>()
  for (const t of treatments) {
    const arr = treatmentsByCat.get(t.category.slug) ?? []
    arr.push(t)
    treatmentsByCat.set(t.category.slug, arr)
  }
  for (const [catSlug, arr] of Array.from(treatmentsByCat.entries())) {
    const pool = CATEGORY_POOL[catSlug]
    if (!pool || pool.length === 0) {
      console.warn(`! no pool for category ${catSlug}`)
      arr.forEach(() => fail++)
      continue
    }
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i]
      if (t.hasImage) { skip++; continue }
      const photoId = pool[i % pool.length]
      try {
        const assetId = await setImage(t._id, 'heroImage', photoId, `${t.title} — placeholder image`)
        console.log(`  ✓ [tr ] ${catSlug}/${t.slug} → ${assetId}`)
        ok++
      } catch (err) {
        console.error(`  ✗ [tr ] ${catSlug}/${t.slug}:`, (err as Error).message)
        fail++
      }
    }
  }

  console.log(`\nDone — ${ok} uploaded, ${skip} skipped (already had image), ${fail} failed`)
}

main().catch((err) => { console.error(err); process.exit(1) })
