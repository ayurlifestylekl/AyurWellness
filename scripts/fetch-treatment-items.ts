import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()
import { createClient } from '@sanity/client'
import { writeFileSync } from 'node:fs'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-10-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

async function main() {
  const cats = await client.fetch<Array<{ _id: string; title: string; slug: string; hasImage: boolean }>>(`
    *[_type == "treatmentCategory" && defined(slug.current)]
      | order(coalesce(order, 9999) asc, title asc) {
        _id, title, "slug": slug.current,
        "hasImage": defined(image.asset)
      }
  `)
  const treatments = await client.fetch<Array<{ _id: string; title: string; slug: string; category: { title: string; slug: string }; hasImage: boolean }>>(`
    *[_type == "treatment" && defined(slug.current)]
      | order(category->order asc, coalesce(order, 9999) asc, title asc) {
        _id, title, "slug": slug.current,
        "category": category->{ title, "slug": slug.current },
        "hasImage": defined(heroImage.asset)
      }
  `)

  writeFileSync('/tmp/sanity-items.json', JSON.stringify({ cats, treatments }, null, 2))
  console.log(`Categories: ${cats.length} (${cats.filter(c => c.hasImage).length} with image)`)
  console.log(`Treatments: ${treatments.length} (${treatments.filter(t => t.hasImage).length} with image)`)
  console.log('Wrote /tmp/sanity-items.json')
}

main().catch((err) => { console.error(err); process.exit(1) })
