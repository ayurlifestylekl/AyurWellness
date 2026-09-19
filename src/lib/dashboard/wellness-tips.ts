/**
 * Rotating Ayurvedic wellness tips for the customer dashboard.
 * Picks one tip per day using day-of-year as the rotation index, so the
 * tip stays consistent across page reloads on the same day but feels
 * fresh from one day to the next.
 *
 * To add tips: just append to the array. Each appears every
 * Math.ceil(365 / tips.length) days on average.
 */

export interface WellnessTip {
  quote: string
  attribution?: string
}

const TIPS: WellnessTip[] = [
  {
    quote: 'Drink warm water through the day — never cold. Cold dulls the digestive fire.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'Eat your largest meal at midday, when the sun (and your digestion) is at its peak.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'Where the kitchen is the pharmacy, the cook is the physician.',
    attribution: 'Classical Ayurveda',
  },
  {
    quote: 'Begin each morning with five minutes of silence before reaching for your phone.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'Self-massage with warm sesame oil — abhyanga — is the oldest form of self-care we know.',
    attribution: 'Classical Ayurveda',
  },
  {
    quote: 'A breath in, a breath out — six rounds, every morning. Your nervous system will thank you.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'Sleep before 10pm. The body restores between 10 and 2, but only if you let it.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'Ghee, honey, and tulsi — three pantry staples that double as medicine.',
    attribution: 'Classical Ayurveda',
  },
  {
    quote: 'Listen to your body before the body has to shout to be heard.',
    attribution: 'our Vaidya',
  },
  {
    quote: 'A clean tongue is a clean digestive tract. Scrape every morning before you brush.',
    attribution: 'Classical Ayurveda',
  },
]

/** Day-of-year (1–365). Stable for the whole day, rotates at midnight. */
function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

export function getTipOfDay(d?: Date): WellnessTip {
  const idx = dayOfYear(d) % TIPS.length
  return TIPS[idx]
}

/** Time-aware greeting for the hero. */
export function getTimeGreeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Resting well'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}
