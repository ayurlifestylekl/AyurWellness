/**
 * Real upload for the Massage Therapies photo set the client supplied
 * (Documents/Ayurvedic Images ) — into Supabase Storage + the `treatments`
 * table, which is the actual source of truth for the live storefront
 * (content was moved out of Sanity; see lib/storefront/treatments.ts).
 *
 * Six treatments got two photos each ("plain" + "(half)") — for those,
 * hero_image_url gets the plain photo and gallery gets BOTH photos as
 * [{url,alt}], which the detail page renders as a 50/50 split hero. The
 * other six treatments just get hero_image_url set.
 *
 * Run: `npx tsx scripts/upload-massage-images-supabase.ts`
 */
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

const IMG_DIR = '/Users/sanjaygunabalan2626gmail.com/Documents/Ayurvedic Images /'
const BUCKET = 'treatment-images'

interface SingleEntry {
  slug: string
  title: string
  file: string
}
interface PairedEntry {
  slug: string
  title: string
  main: string
  half: string
}

const SINGLE: SingleEntry[] = [
  { slug: 'paada-abhyangam-foot-massage', title: 'Paada-Abhyangam (Foot Massage)', file: 'Paada-Abhyangam (Foot Massage) .jpg' },
  { slug: 'head-massage', title: 'Head Massage', file: 'Head Massage.jpg' },
  { slug: 'lymphatic-drainage-massage', title: 'Lymphatic Drainage Massage', file: 'Lymphatic Drainage Massage .jpeg' },
  { slug: 'abhyangam-full-body-oil-massage', title: 'Abhyangam (Full Body Oil Massage)', file: 'Abhyangam (Full Body Oil Massage) .jpg' },
  { slug: 'leg-and-foot-massage-with-kizhi', title: 'Leg and Foot Massage with Kizhi', file: 'Leg and Foot Massage with Kizhi .jpg' },
  { slug: 'siro-abhyangam-head-massage', title: 'Siro-Abhyangam (Head Massage)', file: 'Siro-Abhyangam (Head Massage) .jpg' },
]

const PAIRED: PairedEntry[] = [
  { slug: 'neck-and-shoulder-massage-with-kizhi', title: 'Neck and Shoulder Massage with Kizhi', main: 'Neck and Shoulder Massage with Kizhi .jpg', half: 'Neck and Shoulder Massage with Kizhi(half) .jpg' },
  { slug: 'low-back-leg-massage-with-kizhi', title: 'Low-Back & Leg Massage with Kizhi', main: 'Low-Back & Leg Massage with Kizhi .png', half: 'Low-Back & Leg Massage with Kizhi (half).jpg' },
  { slug: 'abhyangam-with-kashaya-dhaara', title: 'Abhyangam with Kashaya Dhaara', main: 'Abhyangam with Kashaya Dhaara .jpg', half: 'Abhyangam with Kashaya Dhaara (half).jpg' },
  { slug: 'spinal-massage-with-kizhi', title: 'Spinal Massage with Kizhi', main: 'Spinal Massage with Kizhi .webp', half: 'Spinal Massage with Kizhi (half).jpg' },
  { slug: 'abhyangam-with-kizhi', title: 'Abhyangam with Kizhi', main: 'Abhyangam with Kizhi .jpg', half: 'Abhyangam with Kizhi (half).jpg' },
  { slug: 'abhyangam-with-steam-bath', title: 'Abhyangam with Steam Bath', main: 'Abhyangam with Steam Bath .webp', half: 'Abhyangam with Steam Bath (half).jpeg' },
]

function contentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'jpeg' || ext === 'jpg') return 'image/jpeg'
  return 'application/octet-stream'
}

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET)) return
  const { error } = await sb.storage.createBucket(BUCKET, { public: true })
  if (error) throw error
  console.log(`created bucket "${BUCKET}"`)
}

async function uploadOne(slug: string, filename: string): Promise<string> {
  const path = `${IMG_DIR}${filename}`
  if (!existsSync(path)) throw new Error(`file missing: ${path}`)
  const buffer = readFileSync(path)
  const storagePath = `${slug}/${filename.trim().replace(/\s+/g, '-')}`
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: contentType(filename), upsert: true })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function main() {
  await ensureBucket()
  let ok = 0
  let fail = 0

  for (const e of SINGLE) {
    try {
      const heroUrl = await uploadOne(e.slug, e.file)
      const { data, error } = await sb.from('treatments').update({ hero_image_url: heroUrl }).eq('slug', e.slug).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(`no treatment row matched slug "${e.slug}"`)
      console.log(`  ✓ ${e.title} → hero_image_url`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${e.title}:`, (err as Error).message)
      fail++
    }
  }

  for (const e of PAIRED) {
    try {
      const mainUrl = await uploadOne(e.slug, e.main)
      const halfUrl = await uploadOne(e.slug, e.half)
      const gallery = [
        { url: mainUrl, alt: e.title },
        { url: halfUrl, alt: `${e.title} (alternate view)` },
      ]
      const { data, error } = await sb.from('treatments').update({ hero_image_url: mainUrl, gallery }).eq('slug', e.slug).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(`no treatment row matched slug "${e.slug}"`)
      console.log(`  ✓ ${e.title} → hero_image_url + gallery (split)`)
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
