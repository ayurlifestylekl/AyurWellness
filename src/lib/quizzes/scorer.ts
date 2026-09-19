import type {
  ArchetypeKey,
  Dosha,
  DoshaScores,
  PrakritiResult,
} from '@/types/quiz'

const ALL_DOSHAS: Dosha[] = ['vata', 'pitta', 'kapha']

/**
 * Sum responses into dosha point totals. Each response is a single dosha
 * value (the option's `dosha` field). Missing or invalid responses are
 * simply skipped — partial completions still score cleanly.
 */
export function scoreResponses(
  responses: Record<string, Dosha>
): { scores: DoshaScores; totalPoints: number } {
  const scores: DoshaScores = { vata: 0, pitta: 0, kapha: 0 }
  for (const value of Object.values(responses)) {
    if (value === 'vata' || value === 'pitta' || value === 'kapha') {
      scores[value] += 1
    }
  }
  const totalPoints = scores.vata + scores.pitta + scores.kapha
  return { scores, totalPoints }
}

/**
 * Combine two doshas into the canonical dual-archetype key.
 * Canonical order: vata > pitta > kapha (matches classical text ordering).
 */
function dualKey(a: Dosha, b: Dosha): ArchetypeKey {
  const order: Dosha[] = ['vata', 'pitta', 'kapha']
  const [first, second] = [a, b].sort(
    (x, y) => order.indexOf(x) - order.indexOf(y)
  )
  return `${first}-${second}` as ArchetypeKey
}

/**
 * Interpret raw dosha scores into one of 7 archetypes.
 *
 * Rules (in order):
 *   1. If top dosha holds ≥ 50% of total points → SINGLE dominant.
 *   2. Else if the spread between top and bottom is < 20 percentage points
 *      → TRIDOSHIC (all three relatively balanced).
 *   3. Else → DUAL of the top two doshas.
 *
 * Designed to feel decisive — most people score clearly single or dual.
 * Tridoshic is genuinely rare and reserved for near-flat distributions.
 */
export function interpretScores(
  scores: DoshaScores,
  totalPoints: number
): PrakritiResult {
  // Sort doshas by score, descending. Stable for ties (Vata > Pitta > Kapha).
  const ranked = ALL_DOSHAS.slice().sort((a, b) => scores[b] - scores[a])
  const [top, second, third] = ranked

  // Guard against zero-response case (shouldn't happen in real use).
  if (totalPoints === 0) {
    return {
      scores,
      totalPoints,
      archetypeKey: 'tridoshic',
      dominantDosha: top,
      secondaryDosha: null,
    }
  }

  const pct = (n: number) => (n / totalPoints) * 100
  const topPct = pct(scores[top])
  const bottomPct = pct(scores[third])
  const spread = topPct - bottomPct

  // Rule 1 — clear single dominant
  if (topPct >= 50) {
    return {
      scores,
      totalPoints,
      archetypeKey: top,
      dominantDosha: top,
      secondaryDosha: null,
    }
  }

  // Rule 2 — tridoshic (all close)
  if (spread < 20) {
    return {
      scores,
      totalPoints,
      archetypeKey: 'tridoshic',
      dominantDosha: top,
      secondaryDosha: null,
    }
  }

  // Rule 3 — dual archetype of top two
  return {
    scores,
    totalPoints,
    archetypeKey: dualKey(top, second),
    dominantDosha: top,
    secondaryDosha: second,
  }
}

/** Convenience: one-call from raw responses to a final result. */
export function gradeQuiz(responses: Record<string, Dosha>): PrakritiResult {
  const { scores, totalPoints } = scoreResponses(responses)
  return interpretScores(scores, totalPoints)
}

/** Percentage of each dosha relative to total points (rounded). */
export function scorePercentages(scores: DoshaScores, totalPoints: number): DoshaScores {
  if (totalPoints === 0) return { vata: 0, pitta: 0, kapha: 0 }
  return {
    vata: Math.round((scores.vata / totalPoints) * 100),
    pitta: Math.round((scores.pitta / totalPoints) * 100),
    kapha: Math.round((scores.kapha / totalPoints) * 100),
  }
}
