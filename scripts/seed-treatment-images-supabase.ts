/**
 * Assign a themed Unsplash photo to every Supabase treatment + category that
 * lacks one. Stores the direct Unsplash CDN URL in `treatments.hero_image_url`
 * and `treatment_categories.image_url` (no download/upload — images.unsplash.com
 * is already whitelisted in next.config). Each treatment within a category gets
 * a different photo from its theme pool, so the catalogue looks varied.
 *
 * Idempotent: skips rows that already have an image. Pass --force to overwrite.
 *
 * Run: npx tsx scripts/seed-treatment-images-supabase.ts [--force]
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const FORCE = process.argv.includes('--force')
const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

const QS = '?fm=jpg&q=80&w=2000&auto=format&fit=crop'
const photoUrl = (id: string) => `https://images.unsplash.com/photo-${id}${QS}`

/* ── Curated Unsplash photo pools by theme ───────────────────────────── */
const POOL_MASSAGE = [
  '1741522509438-a120c0bb5e88', '1544161515-4ab6ce6db874', '1591343395082-e120087004b4',
  '1741522509407-41cfe73b0b75', '1542848284-8afa78a08ccb', '1701917094553-aa3c13f6d16c',
  '1570174006382-148305ce4972', '1611920630418-f587fdc3bf94', '1728497872660-cc6b16238c3a',
  '1596178060671-7a80dc8059ea', '1709755491926-f7aa83748967', '1664549760921-2198b054a592',
  '1728497872607-fa0b98a3eb79',
]
const POOL_SHIRODHARA = [
  '1731597076108-f3bbe268162f', '1775133263714-848c8fe09e73', '1657452921959-4268016fdf13',
  '1571730021167-16f5c4851b3b', '1743542498905-b1e32377c513', '1769422319849-c4ad944deb56',
  '1701450320883-3563ac4a379b', '1741342079488-1ee8e5d0f09e', '1668534985087-a01de93f872c',
  '1644749024572-12eb159b8bca', '1755010585956-d32a7036ea87', '1768738436447-7df62ffa3912',
  '1560447992-466be70a0c49', '1731056992072-d2dfeb53a1d3', '1644481153470-30cc780841bd',
]
const POOL_FACE = [
  '1570172619644-dfd03ed5d881', '1616394584738-fc6e612e71b9', '1531299204812-e6d44d9a185c',
  '1623120594168-a6d35474043b', '1731514771613-991a02407132', '1664549761426-6a1cb1032854',
  '1516815989420-9cb5ef0fce78', '1713824096348-c1956e6da321', '1623225088166-eea1cdc9775a',
  '1580680639239-49c20331b0d4', '1465400325222-409b0b34be7c', '1670201203150-bf8771401590',
  '1670201202794-b589d5d7e9da', '1580564591877-3a6578d09f5d', '1611169035510-f9af52e6dbe2',
]
const POOL_HERBAL = [
  '1514733670139-4d87a1941d55', '1532091710512-26fd3b2dcf16', '1545840716-c82e9eec6930',
  '1611073761742-bce90ccd60ae', '1532092367580-3bd5bc78dd9d', '1517135399940-2855f5be7c4b',
  '1492552085122-36706c238263', '1495461199391-8c39ab674295', '1506368249639-73a05d6f6488',
  '1581600140682-d4e68c8cde32', '1659328376647-52ec39d1a5cf', '1532336414038-cf19250c5757',
  '1583466478015-2dce6bf2f551', '1504382103100-db7e92322d39', '1531932755987-f95a88affea5',
]
const POOL_SCALP = [
  '1515377905703-c4788e51af15', '1598901986949-f593ff2a31a6', '1595476108010-b4d1f102b1b1',
  '1706795034830-de41aee06afa', '1542848285-4777eb2a621e', '1717160675158-fdd75b8595cf',
  '1717160676422-155f41965293', '1740035680800-d5270855c68d', '1613966582880-80a7327b250f',
  '1767953829433-1e405b6889de', '1672642150262-6edcbffa463e', '1647763769002-189a8d2e40a3',
  '1639195916267-4c5caca21853', '1613835230036-fc791b90795a',
]

/* ── Per-category theme + hero photo (by slug) ───────────────────────── */
const CATEGORY_POOL: Record<string, string[]> = {
  'face-care': POOL_FACE,
  'massage': POOL_MASSAGE,
  'stress-sleep': POOL_SHIRODHARA,
  'oldage': POOL_MASSAGE,
  'hair-care': POOL_SCALP,
  'skin-care': POOL_HERBAL,
  'joint-care': POOL_MASSAGE,
  'eye-care': POOL_HERBAL,
  'nasyam-ear': POOL_HERBAL,
  'kids': POOL_MASSAGE,
  'rehabilitation': POOL_MASSAGE,
  'weight-mgmt': POOL_HERBAL,
  'special': POOL_SHIRODHARA,
  'panchakarma': POOL_MASSAGE,
  'postnatal': POOL_MASSAGE,
}
const CATEGORY_HERO: Record<string, string> = {
  'face-care': '1570172619644-dfd03ed5d881',
  'massage': '1544161515-4ab6ce6db874',
  'stress-sleep': '1657452921959-4268016fdf13',
  'oldage': '1728497872660-cc6b16238c3a',
  'hair-care': '1515377905703-c4788e51af15',
  'skin-care': '1514733670139-4d87a1941d55',
  'joint-care': '1591343395082-e120087004b4',
  'eye-care': '1545840716-c82e9eec6930',
  'nasyam-ear': '1611073761742-bce90ccd60ae',
  'kids': '1611920630418-f587fdc3bf94',
  'rehabilitation': '1701917094553-aa3c13f6d16c',
  'weight-mgmt': '1532091710512-26fd3b2dcf16',
  'special': '1731597076108-f3bbe268162f',
  'panchakarma': '1741522509438-a120c0bb5e88',
  'postnatal': '1596178060671-7a80dc8059ea',
}
const FALLBACK_POOL = POOL_MASSAGE
const FALLBACK_HERO = '1544161515-4ab6ce6db874'

async function main() {
  const { data: cats, error: catErr } = await sb
    .from('treatment_categories')
    .select('id, slug, image_url')
    .order('sort_order', { ascending: true })
  if (catErr) throw catErr

  const slugById = new Map<string, string>()
  let catSet = 0
  for (const c of cats ?? []) {
    slugById.set(c.id, c.slug)
    if (c.image_url && !FORCE) continue
    const hero = CATEGORY_HERO[c.slug] ?? FALLBACK_HERO
    const { error } = await sb.from('treatment_categories').update({ image_url: photoUrl(hero) }).eq('id', c.id)
    if (error) console.error(`  ! category ${c.slug}: ${error.message}`)
    else catSet++
  }
  console.log(`Categories: set ${catSet} image(s).`)

  const { data: treats, error: tErr } = await sb
    .from('treatments')
    .select('id, slug, category_id, hero_image_url, sort_order')
    .order('category_id', { ascending: true })
    .order('sort_order', { ascending: true })
  if (tErr) throw tErr

  const counters = new Map<string, number>()
  let tSet = 0
  for (const t of treats ?? []) {
    const slug = slugById.get(t.category_id) ?? ''
    const pool = CATEGORY_POOL[slug] ?? FALLBACK_POOL
    const i = counters.get(t.category_id) ?? 0
    counters.set(t.category_id, i + 1)
    if (t.hero_image_url && !FORCE) continue
    const photo = pool[i % pool.length]
    const { error } = await sb.from('treatments').update({ hero_image_url: photoUrl(photo) }).eq('id', t.id)
    if (error) console.error(`  ! treatment ${t.slug}: ${error.message}`)
    else tSet++
  }
  console.log(`Treatments: set ${tSet} image(s).`)
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
