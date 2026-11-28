/**
 * Matching what a doctor wrote on a case sheet ("Balashwagandhadi tailam") to
 * a product the centre sells ("Balashwagandhaadi Tailam"), so the front desk
 * can bill it in one tap. Pure, so it works the same on screen and in tests.
 */

const FILLER = new Set(['tailam', 'thailam', 'taila', 'oil', 'awc', 'the', 'ml', 'g', 'gm'])

/** Lower case, letters only, doubled letters made single, without words like "tailam" / "oil". */
export function medicineKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z]+/)
    .filter((w) => w && !FILLER.has(w) && !/^\d/.test(w))
    .join('')
    .replace(/(.)\1+/g, '$1')
    // Common spelling swaps in transliterated Sanskrit.
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/v/g, 'w')
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/** How alike two names are, 0 to 1. */
export function similarity(a: string, b: string): number {
  const x = medicineKey(a)
  const y = medicineKey(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x))) return 0.9
  return 1 - editDistance(x, y) / Math.max(x.length, y.length)
}

/** The product the medicine most likely is, or null when nothing is close enough. */
export function matchMedicine<T extends { name: string }>(medicine: string, products: T[]): T | null {
  let best: T | null = null
  let score = 0
  for (const p of products) {
    const s = similarity(medicine, p.name)
    if (s > score) { score = s; best = p }
  }
  return score >= 0.8 ? best : null
}
