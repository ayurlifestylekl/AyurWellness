/**
 * Merge per-category enrichment files into the treatment seed.
 *
 * Each file in scripts/seed-data/enrich/*.json has the shape:
 *   {
 *     "<categoryRef>": {
 *       "<exact treatment title>": {
 *         "body": ["para", "para"],
 *         "benefits": ["..."],
 *         "procedureSteps": [{ "title": "...", "description": "..." }],
 *         "contraindications": "..."
 *       }
 *     }
 *   }
 *
 * Only body/benefits/procedureSteps/contraindications are applied; all
 * existing fields (price, bookingType, etc.) are preserved. Matching is by
 * (categoryRef, title). Unmatched keys are reported.
 *
 * Usage: npx tsx scripts/enrich-merge.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const SEED = join(process.cwd(), 'scripts/seed-data/treatments-seed.json')
const ENRICH_DIR = join(process.cwd(), 'scripts/seed-data/enrich')

const ENRICH_KEYS = ['body', 'benefits', 'procedureSteps', 'contraindications'] as const

function run() {
  const seed = JSON.parse(readFileSync(SEED, 'utf8'))
  // index treatments by `${categoryRef}::${title}`
  const index = new Map<string, Record<string, unknown>>()
  for (const t of seed.treatments) index.set(`${t.categoryRef}::${t.title}`, t)

  if (!existsSync(ENRICH_DIR)) {
    console.error('[enrich] no enrich dir:', ENRICH_DIR)
    process.exit(1)
  }

  let applied = 0
  const unmatched: string[] = []
  for (const file of readdirSync(ENRICH_DIR).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(join(ENRICH_DIR, file), 'utf8'))
    for (const [catRef, byTitle] of Object.entries(data as Record<string, Record<string, Record<string, unknown>>>)) {
      for (const [title, enrich] of Object.entries(byTitle)) {
        const t = index.get(`${catRef}::${title}`)
        if (!t) {
          unmatched.push(`${file}: ${catRef}::${title}`)
          continue
        }
        for (const k of ENRICH_KEYS) {
          if (enrich[k] !== undefined) t[k] = enrich[k]
        }
        applied++
      }
    }
  }

  writeFileSync(SEED, JSON.stringify(seed, null, 2) + '\n')
  console.log(`[enrich] applied enrichment to ${applied} treatments`)
  if (unmatched.length) {
    console.log(`[enrich] ${unmatched.length} unmatched keys:`)
    unmatched.forEach((u) => console.log('  -', u))
  }
}

run()
