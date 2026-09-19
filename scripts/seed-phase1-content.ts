/**
 * Phase-1 seed script for Sanity Studio.
 *
 * Populates the pieces the client needs visible before the Phase 1
 * sign-off meeting:
 *   - 3 FAQ categories (soft groupings used in the Studio sidebar)
 *   - All 17 existing FAQs migrated from src/data/faqs.ts,
 *     src/data/contactFaqs.ts, and src/data/about.ts
 *   - The About page singleton with all current hard-coded copy
 *   - 1 author (Vaidya AKHIL HS)
 *   - 3 journal posts with a shared hero image from /public
 *
 * Usage (from ayurvedic/):
 *   npx tsx scripts/seed-phase1-content.ts
 *
 * Behaviour:
 *   - Every document has a deterministic _id so re-running the script is
 *     idempotent — existing docs are left alone via `createIfNotExists`.
 *   - Use `--overwrite` to replace existing docs (use with caution — will
 *     clobber any edits the client has made in Studio).
 */

import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@sanity/client'
import type { SanityAssetDocument } from '@sanity/client'

// Load .env.local first (Next.js convention), then fall back to .env.
loadEnv({ path: resolve(__dirname, '..', '.env.local') })
loadEnv({ path: resolve(__dirname, '..', '.env') })

import { faqs as homeFaqs } from '../src/data/faqs'
import { contactFaqs } from '../src/data/contactFaqs'
import { aboutFaqs } from '../src/data/about'

/* ── Env + client ───────────────────────────────────────── */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  console.error(
    '[seed] Missing env vars. Need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN in .env.local',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
})

const overwrite = process.argv.includes('--overwrite')
const upsert = overwrite ? client.createOrReplace.bind(client) : client.createIfNotExists.bind(client)

/* ── FAQ categories ─────────────────────────────────────── */

const faqCategories = [
  {
    _id: 'faqCat.general',
    _type: 'faqCategory' as const,
    title: 'General',
    slug: { _type: 'slug', current: 'general' },
    order: 1,
  },
  {
    _id: 'faqCat.treatments',
    _type: 'faqCategory' as const,
    title: 'Treatments & Consultation',
    slug: { _type: 'slug', current: 'treatments' },
    order: 2,
  },
  {
    _id: 'faqCat.shipping',
    _type: 'faqCategory' as const,
    title: 'Shipping & Payment',
    slug: { _type: 'slug', current: 'shipping-payment' },
    order: 3,
  },
  {
    _id: 'faqCat.about',
    _type: 'faqCategory' as const,
    title: 'About KALS',
    slug: { _type: 'slug', current: 'about-kals' },
    order: 4,
  },
]

/**
 * Rough rules-of-thumb for mapping source FAQ ids → categories. Anything
 * that doesn't match goes into General so nothing is dropped.
 */
const CATEGORY_RULES: Array<{ match: RegExp; categoryId: string }> = [
  { match: /consult|appointment|walk-in|therap|same-gender|pregnancy/, categoryId: 'faqCat.treatments' },
  { match: /shipping|payment|cancellation/, categoryId: 'faqCat.shipping' },
  { match: /vaidya|kkm|kerala-therap|kids|working/, categoryId: 'faqCat.about' },
]

function categoryFor(id: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(id)) return rule.categoryId
  }
  return 'faqCat.general'
}

/* ── FAQs ───────────────────────────────────────────────── */

type Surface = 'home' | 'contact' | 'about'

function faqDoc(faq: { id: string; question: string; answer: string }, surface: Surface, order: number) {
  return {
    _id: `faq.${surface}.${faq.id}`,
    _type: 'faq' as const,
    question: faq.question,
    answer: faq.answer,
    surface,
    category: { _type: 'reference' as const, _ref: categoryFor(faq.id) },
    order,
  }
}

const allFaqs = [
  ...homeFaqs.map((f, i) => faqDoc(f, 'home', i + 1)),
  ...contactFaqs.map((f, i) => faqDoc(f, 'contact', i + 1)),
  ...aboutFaqs.map((f, i) => faqDoc(f, 'about', i + 1)),
]

/* ── About page singleton ──────────────────────────────── */

const aboutPageDoc = {
  _id: 'aboutPage',
  _type: 'aboutPage' as const,
  heroEyebrow: 'About Kerala Ayurvedic Lifestyle',
  heroHeadlineLead: 'A Sanctuary for\nAuthentic',
  heroHeadlineAccent: 'Healing',
  heroSubheading:
    'Since 2008, we have brought the timeless wisdom of Kerala Ayurveda to Brickfields — a space where tradition, care, and natural healing come together in harmony.',
  heroStats: [
    { value: '17+', label: 'Years in Brickfields' },
    { value: '5,000+', label: 'Patients Healed' },
    { value: '20+', label: 'Traditional Therapies' },
  ],
  founderEyebrow: 'Our Story',
  founderHeadlineLead: "Bringing Kerala's healing",
  founderHeadlineAccent: 'home.',
  founderParagraphs: [
    'Kerala Ayurvedic Lifestyle was founded with a simple yet powerful vision — to provide genuine Kerala Ayurvedic therapies to people in Malaysia without compromise.',
    'Inspired by witnessing the profound healing experienced by individuals who traveled to Kerala, Datto Shan envisioned creating the same experience closer to home.',
    'By bringing skilled therapists and experienced Ayurveda practitioners directly from Kerala, we ensure that every therapy reflects the true essence of this ancient science. Our journey has always been guided by authenticity, care, and a deep respect for traditional healing methods.',
  ],
  founderPullQuote:
    'True wellness is not just about therapies, but about restoring balance and harmony within.',
  founderName: 'Datto Shan',
  founderRole: 'Founder',
  commitmentEyebrow: 'Our Commitment to You',
  commitmentHeadlineLead: 'Your partners in',
  commitmentHeadlineAccent: 'health.',
  commitmentBody:
    'For over 15 years, KALS has been a trusted name in holistic healing. Our mission remains the same as the day we started: to help you rediscover balance and vitality through integrity, compassion, and excellence.',
  commitmentClosingLine: 'Experience the difference that true Ayurveda makes.',
  commitmentPrimaryLabel: 'Book a Consultation',
  commitmentPrimaryHref: 'https://cal.com/kerala-ayurvedic',
  commitmentSecondaryLabel: 'WhatsApp Us',
  commitmentSecondaryHref: 'https://wa.me/601165043436',
  commitmentTrustPills: ['Since 2008', 'Brickfields, KL', 'Vaidya AKHIL HS (B.A.M.S)'],
}

/* ── Author + blog posts ───────────────────────────────── */

const authorDoc = {
  _id: 'author.vaidya-akhil',
  _type: 'author' as const,
  name: 'Vaidya AKHIL HS',
  slug: { _type: 'slug', current: 'vaidya-akhil-hs' },
  role: 'Vaidya · B.A.M.S Kerala',
  bio:
    'Vaidya AKHIL HS is the lead Ayurvedic physician at Kerala Ayurvedic Lifestyle in Brickfields, Kuala Lumpur. He holds a B.A.M.S (Bachelor of Ayurvedic Medicine and Surgery) and carries 16+ years of clinical experience from Kerala.',
}

/** Plain-text paragraphs → portable-text blocks. */
function toPortableText(paragraphs: string[]) {
  return paragraphs.map((text, i) => ({
    _type: 'block' as const,
    _key: `block-${i}`,
    style: 'normal' as const,
    markDefs: [],
    children: [
      {
        _type: 'span' as const,
        _key: `span-${i}`,
        text,
        marks: [],
      },
    ],
  }))
}

interface PostSeed {
  slug: string
  title: string
  excerpt: string
  paragraphs: string[]
  tags: string[]
  publishedAt: string
  readingTimeMinutes?: number
}

const postSeeds: PostSeed[] = [
  {
    slug: 'treat-the-root-not-the-symptom',
    title: 'Why Kerala Ayurveda Treats the Root, Not the Symptom',
    excerpt:
      'Kerala Ayurveda asks a different first question. Not "what hurts?" — but "why does it hurt, and what in your daily life keeps it hurting?"',
    paragraphs: [
      'Most modern medicine begins with a symptom and ends with a prescription. Headache? Painkiller. Acid reflux? Antacid. Trouble sleeping? A tablet. The reasoning is elegant and often necessary — but it rarely asks a different first question: why is the body producing the symptom in the first place?',
      'Kerala Ayurveda begins with that question. Before a therapy is chosen, before any oil is warmed, the Vaidya wants to understand your dosha (your constitutional type), your agni (your digestive fire), your daily rhythm, your stress, your food, your sleep. Only then does a protocol take shape — and it is always personal.',
      'A headache that comes every afternoon at 3pm after you skip lunch is not the same as one that wakes you up at 4am. A skin flare-up that worsens in the dry season is treated differently from one that runs in your family. Two guests can walk into our clinic with the same complaint and walk out with two very different protocols — because the root of their discomfort is different.',
      'This is why Kerala Ayurvedic Lifestyle always starts with a 30-minute consultation. It is not a gatekeeping ritual. It is the treatment beginning.',
    ],
    tags: ['Philosophy', 'Dosha'],
    publishedAt: '2026-03-10T09:00:00.000Z',
    readingTimeMinutes: 4,
  },
  {
    slug: 'panchakarma-for-working-professionals',
    title: "Panchakarma in the Age of Burnout: A Working Professional's Guide",
    excerpt:
      'You do not need a month in the mountains to do Panchakarma. You need a protocol that fits your calendar — and a Vaidya who will build one with you.',
    paragraphs: [
      "Panchakarma — literally 'five actions' — is Ayurveda's flagship deep-cleansing protocol. In its classical Kerala form, it runs for 14 to 28 days, with each day devoted to oil massage, herbal steam, purgation, nasal therapy, or medicated enemas. It is extraordinary. And for most working professionals in KL, it is completely impractical.",
      'Which is a problem, because the people who most need Panchakarma are exactly the people who cannot take three weeks off: the professional on their phone at 11pm, the founder running on three hours of sleep, the parent juggling work and kids and ageing relatives. If the body is a house, Panchakarma is spring-cleaning it. And spring-cleaning after fifteen years of deferred maintenance is non-negotiable.',
      'So we adapt. At KALS we run what we call Panchakarma-Lite: shorter, modular protocols that fit around a 9-to-5 (or a 9-to-9). You do the oil therapies in the evening, you fast lightly, you adjust your meals, and we keep the timeline to 7 or 10 days instead of 21. It is not the full classical protocol — but it is 70% of the benefit at 30% of the time, and it is the version your body will actually say yes to.',
      'The real secret is not the therapy. It is the consistency. A guest who does Panchakarma-Lite twice a year will be in better shape than one who waits for the perfect 28-day window that never arrives.',
    ],
    tags: ['Panchakarma', 'Lifestyle'],
    publishedAt: '2026-03-22T09:00:00.000Z',
    readingTimeMinutes: 5,
  },
  {
    slug: 'reading-your-dosha-a-beginners-introduction',
    title: "Reading Your Dosha: A Beginner's Introduction",
    excerpt:
      'Vata, Pitta, Kapha. Three words, entire libraries. Here is the shortest honest introduction we can write — and how to start noticing yours.',
    paragraphs: [
      "Every body is a blend of three doshas — Vata, Pitta, Kapha — each made of two elements. Vata is air and space: the mover, the thinker, the quickly-anxious. Pitta is fire and water: the transformer, the organiser, the easily-irritated. Kapha is earth and water: the steady one, the nurturer, the sometimes-stuck.",
      'Everyone has all three, but one or two tend to dominate. Your dominant dosha is called your prakriti — your natural constitution. It is largely fixed from birth. What changes day-to-day, season-to-season, is your vikriti — your current imbalance. Most of what Ayurveda does is gently nudge your vikriti back toward your prakriti.',
      'Quick self-check. If you have cold hands, bloat easily, struggle with sleep and have a racing mind, vata is likely spiking. If you run hot, skip meals dangerously, break out on the chin and get short-tempered by 4pm, that is a pitta flare. If you wake up heavy, crave sugar, move slowly and hold on to weight, kapha is accumulating.',
      'The fastest intervention? Eat for the dosha that is out of balance. Warm food and oil for vata. Cool, bitter greens for pitta. Light, spicy, stimulating for kapha. It is not a cure — that is what the consultation and therapy protocol is for. But it is a start, and it gives your body a 24-hour chance to tell you something before you book.',
    ],
    tags: ['Dosha', 'Beginner'],
    publishedAt: '2026-04-05T09:00:00.000Z',
    readingTimeMinutes: 6,
  },
]

/* ── Hero image upload ─────────────────────────────────── */

async function uploadHeroImage(): Promise<SanityAssetDocument> {
  const imagePath = resolve(__dirname, '..', 'public', 'hero-tray.png')
  const buffer = readFileSync(imagePath)
  const asset = await client.assets.upload('image', buffer, {
    filename: 'hero-tray.png',
    contentType: 'image/png',
  })
  return asset
}

/* ── Main ───────────────────────────────────────────────── */

async function run() {
  console.log(
    `[seed] Mode: ${overwrite ? 'OVERWRITE (createOrReplace)' : 'SAFE (createIfNotExists)'}`,
  )

  console.log(`[seed] Upserting ${faqCategories.length} FAQ categories…`)
  for (const cat of faqCategories) await upsert(cat)

  console.log(`[seed] Upserting ${allFaqs.length} FAQs…`)
  for (const faq of allFaqs) await upsert(faq)

  console.log('[seed] Upserting About page singleton…')
  await upsert(aboutPageDoc)

  console.log('[seed] Upserting Vaidya AKHIL author…')
  await upsert(authorDoc)

  console.log('[seed] Uploading hero image asset…')
  const heroAsset = await uploadHeroImage()
  console.log(`[seed]   → asset id: ${heroAsset._id}`)

  console.log(`[seed] Upserting ${postSeeds.length} journal posts…`)
  for (const post of postSeeds) {
    await upsert({
      _id: `post.${post.slug}`,
      _type: 'post',
      title: post.title,
      slug: { _type: 'slug', current: post.slug },
      excerpt: post.excerpt,
      heroImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: heroAsset._id },
        alt: 'Ayurvedic herbs and therapeutic oils on a wooden tray',
      },
      author: { _type: 'reference', _ref: authorDoc._id },
      publishedAt: post.publishedAt,
      tags: post.tags,
      readingTimeMinutes: post.readingTimeMinutes,
      body: toPortableText(post.paragraphs),
    })
  }

  console.log('[seed] Done.')
}

run().catch((err) => {
  console.error('[seed] FAILED:', err)
  process.exit(1)
})
