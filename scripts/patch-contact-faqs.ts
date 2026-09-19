/**
 * One-off patch — rewrites the two contact FAQ answers in Sanity that
 * referenced "Vaidya AKHIL HS" by name. After the brand-led repositioning
 * the practice prefers the plural, generic "our Vaidyas" voice.
 *
 * Usage (from ayurvedic/):
 *   npx tsx scripts/patch-contact-faqs.ts
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@sanity/client'

loadEnv({ path: resolve(__dirname, '..', '.env.local') })
loadEnv({ path: resolve(__dirname, '..', '.env') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  console.error('[patch] Missing env. Need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-10-01',
  useCdn: false,
})

const updates: Array<{ id: string; answer: string }> = [
  {
    id: 'faq.contact.appointment-needed',
    answer:
      'Yes — all first-time consultations with our Vaidyas are by appointment so they can dedicate proper time to your case history. Walk-ins are welcome for the Ayur-Store any time during opening hours. You can book via WhatsApp, the form on this page, or the main Treatments page.',
  },
  {
    id: 'faq.contact.pregnancy-safety',
    answer:
      'Some treatments (specific oil therapies and prenatal Garbhini Paricharya) are safe and genuinely beneficial during pregnancy. Others are contraindicated. Please mention your trimester in the form or on WhatsApp — our Vaidyas will personally advise what is appropriate for your stage.',
  },
]

async function main() {
  for (const { id, answer } of updates) {
    try {
      const result = await client.patch(id).set({ answer }).commit()
      console.log(`[patch] ✓ ${id} (rev ${result._rev})`)
    } catch (err) {
      console.error(`[patch] ✗ ${id} —`, err instanceof Error ? err.message : err)
    }
  }
}

main()
