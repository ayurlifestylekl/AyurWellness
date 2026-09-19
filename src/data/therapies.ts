import type { Therapy } from '@/types/content'

export const therapies: Therapy[] = [
  {
    slug: 'consultation',
    name: 'Consultation',
    tagline: 'Personal therapist session',
    durationMin: 45,
    priceRm: 150,
    image:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Full pulse + tongue diagnosis (Nadi Pareeksha)',
      'Personalised dosha plan from our therapists',
      'Take-home routine + product script',
    ],
    doshas: ['vata', 'pitta', 'kapha'],
    useCases: ['intake', 'assessment'],
    preVisit: [
      'Note 2–3 questions or concerns to discuss',
      'Avoid heavy meals 2 hours prior',
      'Bring any current supplements or prescriptions',
      'For virtual visits — test your camera and mic beforehand',
    ],
  },
  {
    slug: 'abhyanga',
    name: 'Abhyanga',
    tagline: 'Warm Oil Massage',
    durationMin: 60,
    priceRm: 180,
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Synchronised four-hand technique',
      'Personalised herbal oil blend',
      'Releases deep muscle tension',
    ],
    doshas: ['vata'],
    useCases: ['stress', 'muscle-tension', 'dry-skin'],
    preVisit: [
      'Avoid heavy meals 2 hours prior',
      'Wear loose, comfortable clothing',
      'Arrive 15 minutes early to settle',
      'Skip shower the morning of the session',
    ],
  },
  {
    slug: 'shirodhara',
    name: 'Shirodhara',
    tagline: 'Forehead Oil Stream',
    durationMin: 45,
    priceRm: 220,
    image:
      'https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Quietens the nervous system',
      'Improves sleep quality',
      'Eases anxiety and headaches',
    ],
    doshas: ['vata', 'pitta'],
    useCases: ['anxiety', 'insomnia', 'headache'],
    preVisit: [
      'Light meal at least 2 hours before',
      'Tie back long hair — oil will saturate the scalp',
      'Plan a quiet evening after — no driving long distances',
      'Avoid caffeine on the day of treatment',
    ],
  },
  {
    slug: 'pizhichil',
    name: 'Pizhichil',
    tagline: 'Royal Oil Bath',
    durationMin: 75,
    priceRm: 320,
    image:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Continuous warm-oil pour',
      'Signature Ayurvedic therapy',
      'Deep muscular and joint relief',
    ],
    doshas: ['vata', 'pitta'],
    useCases: ['chronic-pain', 'rejuvenation'],
    preVisit: [
      'Eat lightly 2–3 hours prior',
      'Bring a change of comfortable, loose clothing',
      'Hydrate well in the hours leading up',
      'Plan rest for the remainder of the day',
    ],
  },
  {
    slug: 'udwarthanam',
    name: 'Udwarthanam',
    tagline: 'Herbal Powder Massage',
    durationMin: 50,
    priceRm: 160,
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Dry powder massage against the grain',
      'Stimulates lymph and metabolism',
      'Classical Kapha-balancing therapy',
    ],
    doshas: ['kapha'],
    useCases: ['weight-management', 'lymph-drainage', 'cellulite'],
    preVisit: [
      'Empty stomach or very light meal beforehand',
      'Wear minimal, washable clothing — powders may dust the skin',
      'Plan a warm shower after, not before',
      'Drink warm water through the day',
    ],
  },
  {
    slug: 'panchakarma',
    name: 'Panchakarma',
    tagline: 'Five-Stage Detox',
    durationMin: 90,
    priceRm: 480,
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Complete cellular detoxification',
      'Custom dosha assessment',
      'Multi-day retreat option',
    ],
    doshas: ['vata', 'pitta', 'kapha'],
    useCases: ['detox', 'rejuvenation', 'reset'],
    preVisit: [
      'Begin a simple, vegetarian diet 3 days prior',
      'Avoid alcohol and caffeine for 48 hours before',
      'Plan a clear schedule — Panchakarma is energy-intensive',
      'Bring loose clothing and a journal',
      'Confirm any prescriptions with your therapist in advance',
    ],
  },
  {
    slug: 'nasya',
    name: 'Nasya',
    tagline: 'Nasal Therapy',
    durationMin: 30,
    priceRm: 120,
    image:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
    bullets: [
      'Clears sinus congestion',
      'Eases chronic headaches',
      'Sharpens mental clarity',
    ],
    doshas: ['kapha', 'vata'],
    useCases: ['sinus', 'headache', 'mental-clarity'],
    preVisit: [
      'Blow your nose gently before arrival',
      'Avoid heavy meals 1 hour prior',
      'Skip cold drinks the morning of',
      'Plan to stay warm for an hour after',
    ],
  },
]

/** Generic pre-visit checklist used when a therapy slug isn't found. */
export const GENERIC_PRE_VISIT: string[] = [
  'Avoid heavy meals 2 hours prior',
  'Wear loose, comfortable clothing',
  'Arrive 15 minutes early to settle',
  'Hydrate well in the hours leading up',
]

/**
 * Best-effort lookup by free-text treatment name from an appointment row.
 * Tries exact match, then case-insensitive contains. Returns null when
 * no match is found — callers should fall back to `GENERIC_PRE_VISIT`.
 */
export function findTherapyByName(name: string | null | undefined): Therapy | null {
  if (!name) return null
  const norm = name.trim().toLowerCase()
  const exact = therapies.find((t) => t.name.toLowerCase() === norm)
  if (exact) return exact
  const partial = therapies.find((t) => norm.includes(t.name.toLowerCase()))
  return partial ?? null
}
