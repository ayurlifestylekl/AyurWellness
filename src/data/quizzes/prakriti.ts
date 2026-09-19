import type {
  ArchetypeKey,
  Archetype,
  PrakritiQuizDefinition,
  QuizSection,
} from '@/types/quiz'

/**
 * Prakriti — Ayurvedic constitution assessment.
 *
 * 24 questions across 6 sections. Each question presents three options
 * mapped (internally) to Vata, Pitta, or Kapha. Option labels are written
 * in plain English so the customer never sees which dosha they're picking.
 *
 * Scoring is implemented in `src/lib/quizzes/scorer.ts`.
 */

// ─── Sections ────────────────────────────────────────────────────────────

const sections: QuizSection[] = [
  // 1 — BODY
  {
    id: 'body',
    title: 'Your Body',
    sanskrit: 'Shareera',
    intro:
      'How your physical frame, skin, and hair show up day to day. These traits stay consistent through adulthood and tell us a lot about your underlying constitution.',
    questions: [
      {
        id: 'body-frame',
        prompt: 'Which best describes your natural body frame?',
        helper: 'Think of how you’ve been built since adulthood, not your current weight.',
        options: [
          {
            id: 'body-frame-v',
            label: 'Light and slender',
            hint: 'Narrow shoulders or hips, prominent joints, struggle to gain weight.',
            dosha: 'vata',
            icon: 'feather',
          },
          {
            id: 'body-frame-p',
            label: 'Medium and athletic',
            hint: 'Proportionate, muscular when active, gains and loses weight easily.',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'body-frame-k',
            label: 'Solid and sturdy',
            hint: 'Broader build, fuller curves, gains weight readily, slow to lose it.',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'body-weight',
        prompt: 'How does your weight change over the years?',
        options: [
          {
            id: 'body-weight-v',
            label: 'Stays light, hard to put on',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'body-weight-p',
            label: 'Fluctuates with activity and stress',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'body-weight-k',
            label: 'Tends to creep up, slow to come off',
            dosha: 'kapha',
            icon: 'droplet',
          },
        ],
      },
      {
        id: 'body-skin',
        prompt: 'What is your skin usually like — at its baseline?',
        options: [
          {
            id: 'body-skin-v',
            label: 'Dry, thin, cool to touch',
            hint: 'Can feel rough or flaky in cold or wind.',
            dosha: 'vata',
            icon: 'leaf',
          },
          {
            id: 'body-skin-p',
            label: 'Warm, sensitive, prone to redness',
            hint: 'Flushes easily, may have freckles or sun sensitivity.',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'body-skin-k',
            label: 'Smooth, thick, slightly oily',
            hint: 'Cool, soft, slower to age but prone to congestion.',
            dosha: 'kapha',
            icon: 'droplet',
          },
        ],
      },
      {
        id: 'body-hair',
        prompt: 'How would you describe your hair?',
        options: [
          {
            id: 'body-hair-v',
            label: 'Fine, dry, sometimes frizzy',
            dosha: 'vata',
            icon: 'feather',
          },
          {
            id: 'body-hair-p',
            label: 'Soft, fine, prone to early greying or thinning',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'body-hair-k',
            label: 'Thick, glossy, wavy or oily',
            dosha: 'kapha',
            icon: 'leaf',
          },
        ],
      },
    ],
  },

  // 2 — DIGESTION
  {
    id: 'digestion',
    title: 'Digestion & Appetite',
    sanskrit: 'Agni',
    intro:
      'Agni — your digestive fire — is the single most important factor in Ayurveda. How you hunger, eat, and eliminate reveals your inner balance.',
    questions: [
      {
        id: 'dig-appetite',
        prompt: 'What is your appetite usually like?',
        options: [
          {
            id: 'dig-appetite-v',
            label: 'Irregular — can forget to eat, then suddenly ravenous',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'dig-appetite-p',
            label: 'Sharp and on schedule — get cranky if I skip a meal',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'dig-appetite-k',
            label: 'Steady but low — can easily skip a meal without noticing',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'dig-thirst',
        prompt: 'How often do you feel thirsty?',
        options: [
          {
            id: 'dig-thirst-v',
            label: 'Variable — sometimes a lot, sometimes I forget to drink',
            dosha: 'vata',
            icon: 'cloud',
          },
          {
            id: 'dig-thirst-p',
            label: 'Often, especially for cool drinks',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'dig-thirst-k',
            label: 'Rarely — I can go long stretches without water',
            dosha: 'kapha',
            icon: 'droplet',
          },
        ],
      },
      {
        id: 'dig-bowel',
        prompt: 'How would you describe your bowel habits at baseline?',
        options: [
          {
            id: 'dig-bowel-v',
            label: 'Irregular, often dry or constipated',
            dosha: 'vata',
            icon: 'leaf',
          },
          {
            id: 'dig-bowel-p',
            label: 'Frequent, can be loose, especially under stress',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'dig-bowel-k',
            label: 'Slow, heavy, but regular',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'dig-foods',
        prompt: 'Which foods do you naturally gravitate towards?',
        options: [
          {
            id: 'dig-foods-v',
            label: 'Warm, oily, grounding — soups, stews, rice with ghee',
            dosha: 'vata',
            icon: 'droplet',
          },
          {
            id: 'dig-foods-p',
            label: 'Cool, hydrating, fresh — salads, fruits, milk, coconut water',
            dosha: 'pitta',
            icon: 'leaf',
          },
          {
            id: 'dig-foods-k',
            label: 'Light, spicy, dry — toast, popcorn, hot tea, ginger',
            dosha: 'kapha',
            icon: 'flame',
          },
        ],
      },
    ],
  },

  // 3 — ENERGY & SLEEP
  {
    id: 'energy-sleep',
    title: 'Energy & Sleep',
    sanskrit: 'Ojas · Nidra',
    intro:
      'Your daily energy curve and how you rest at night. Ojas — vitality — is built and depleted by these rhythms.',
    questions: [
      {
        id: 'sleep-depth',
        prompt: 'How do you sleep?',
        options: [
          {
            id: 'sleep-depth-v',
            label: 'Light and easily disturbed — wake from any noise',
            dosha: 'vata',
            icon: 'moon',
          },
          {
            id: 'sleep-depth-p',
            label: 'Moderate — 6–8 hours, occasional hot or vivid nights',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'sleep-depth-k',
            label: 'Deep and long — could sleep 9+ hours given the chance',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'sleep-dreams',
        prompt: 'What are your dreams typically like?',
        options: [
          {
            id: 'sleep-dreams-v',
            label: 'Fleeting, anxious, full of movement or flying',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'sleep-dreams-p',
            label: 'Vivid, intense, sometimes confrontational',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'sleep-dreams-k',
            label: 'Calm, watery, romantic — or none I remember',
            dosha: 'kapha',
            icon: 'droplet',
          },
        ],
      },
      {
        id: 'energy-curve',
        prompt: 'What does your energy do across the day?',
        options: [
          {
            id: 'energy-curve-v',
            label: 'Comes in bursts — high creativity then sudden fatigue',
            dosha: 'vata',
            icon: 'sparkle',
          },
          {
            id: 'energy-curve-p',
            label: 'Strong and consistent until I push too far',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'energy-curve-k',
            label: 'Steady all day, slow to start in the morning',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'recovery',
        prompt: 'How do you recover from a hard day?',
        options: [
          {
            id: 'recovery-v',
            label: 'Need rest and warmth — easily depleted',
            dosha: 'vata',
            icon: 'leaf',
          },
          {
            id: 'recovery-p',
            label: 'Need to vent or move it out — then I’m back',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'recovery-k',
            label: 'A long sleep and I’m as good as new',
            dosha: 'kapha',
            icon: 'moon',
          },
        ],
      },
    ],
  },

  // 4 — MIND
  {
    id: 'mind',
    title: 'Mind & Learning',
    sanskrit: 'Manas',
    intro:
      'How your mind moves — how you think, learn, and remember. This is your cognitive rhythm.',
    questions: [
      {
        id: 'mind-thinking',
        prompt: 'How does your mind tend to move?',
        options: [
          {
            id: 'mind-thinking-v',
            label: 'Quick, creative, jumps between ideas',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'mind-thinking-p',
            label: 'Sharp, focused, decisive',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'mind-thinking-k',
            label: 'Slow to start, deep once engaged, very thorough',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'mind-memory',
        prompt: 'What kind of memory do you have?',
        options: [
          {
            id: 'mind-memory-v',
            label: 'Learn fast, forget faster',
            dosha: 'vata',
            icon: 'feather',
          },
          {
            id: 'mind-memory-p',
            label: 'Learn quickly, retain selectively but precisely',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'mind-memory-k',
            label: 'Take time to learn, never forget once learned',
            dosha: 'kapha',
            icon: 'gem',
          },
        ],
      },
      {
        id: 'mind-learning',
        prompt: 'How do you best take in new information?',
        options: [
          {
            id: 'mind-learning-v',
            label: 'Listening and talking — verbal exchange',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'mind-learning-p',
            label: 'Reading and analysing — visual + critical',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'mind-learning-k',
            label: 'Doing — repetition, hands-on practice',
            dosha: 'kapha',
            icon: 'sprout',
          },
        ],
      },
      {
        id: 'mind-mood',
        prompt: 'What is your emotional baseline most days?',
        options: [
          {
            id: 'mind-mood-v',
            label: 'Enthusiastic but inconsistent — moods shift quickly',
            dosha: 'vata',
            icon: 'sparkle',
          },
          {
            id: 'mind-mood-p',
            label: 'Driven, occasionally intense, quick to opinion',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'mind-mood-k',
            label: 'Even, content, slow to anger',
            dosha: 'kapha',
            icon: 'leaf',
          },
        ],
      },
    ],
  },

  // 5 — TEMPERAMENT UNDER STRESS
  {
    id: 'stress',
    title: 'Under Pressure',
    sanskrit: 'Vikriti-prone',
    intro:
      'How you respond when stress lands. Each constitution has a signature stress signal — recognising yours is the first step to working with it.',
    questions: [
      {
        id: 'stress-reaction',
        prompt: 'When stress hits, what shows up first?',
        options: [
          {
            id: 'stress-reaction-v',
            label: 'Worry, racing thoughts, trouble sleeping',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'stress-reaction-p',
            label: 'Irritation, short fuse, heat in the body',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'stress-reaction-k',
            label: 'Heaviness, withdrawal, wanting to sleep or eat',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'stress-conflict',
        prompt: 'In a conflict you tend to —',
        options: [
          {
            id: 'stress-conflict-v',
            label: 'Avoid, deflect, or talk around it',
            dosha: 'vata',
            icon: 'feather',
          },
          {
            id: 'stress-conflict-p',
            label: 'Confront directly, sometimes with heat',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'stress-conflict-k',
            label: 'Quietly hold ground, slow to escalate or change my mind',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'stress-body',
        prompt: 'Where does stress live in your body?',
        options: [
          {
            id: 'stress-body-v',
            label: 'Shoulders, lower back, dry mouth, cold hands',
            dosha: 'vata',
            icon: 'leaf',
          },
          {
            id: 'stress-body-p',
            label: 'Jaw, stomach acid, head, hot skin',
            dosha: 'pitta',
            icon: 'sparkle',
          },
          {
            id: 'stress-body-k',
            label: 'Chest, sinuses, heaviness, fluid retention',
            dosha: 'kapha',
            icon: 'droplet',
          },
        ],
      },
      {
        id: 'stress-recovery',
        prompt: 'What helps you recover fastest?',
        options: [
          {
            id: 'stress-recovery-v',
            label: 'Warm food, a quiet room, oil massage',
            dosha: 'vata',
            icon: 'droplet',
          },
          {
            id: 'stress-recovery-p',
            label: 'Cool air, water, a run, a problem solved',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'stress-recovery-k',
            label: 'Movement, sweat, a change of scenery',
            dosha: 'kapha',
            icon: 'wind',
          },
        ],
      },
    ],
  },

  // 6 — LIFESTYLE
  {
    id: 'lifestyle',
    title: 'Lifestyle & Climate',
    sanskrit: 'Ritucharya',
    intro:
      'How you live with the seasons, exercise, and other people. The body’s preferences are wisdom — they tell us what to lean into.',
    questions: [
      {
        id: 'life-climate',
        prompt: 'Which climate feels best for you?',
        options: [
          {
            id: 'life-climate-v',
            label: 'Warm and humid — I hate cold and wind',
            dosha: 'vata',
            icon: 'sun',
          },
          {
            id: 'life-climate-p',
            label: 'Cool and breezy — heat makes me cranky',
            dosha: 'pitta',
            icon: 'wind',
          },
          {
            id: 'life-climate-k',
            label: 'Warm and dry — I dislike heavy humidity',
            dosha: 'kapha',
            icon: 'flame',
          },
        ],
      },
      {
        id: 'life-exercise',
        prompt: 'How does your body respond to exercise?',
        options: [
          {
            id: 'life-exercise-v',
            label: 'Get tired fast, prefer gentle yoga or walks',
            dosha: 'vata',
            icon: 'feather',
          },
          {
            id: 'life-exercise-p',
            label: 'Strong endurance, love competition, can overdo it',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'life-exercise-k',
            label: 'Slow start, strong stamina once warmed up',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
      {
        id: 'life-social',
        prompt: 'In social settings you —',
        options: [
          {
            id: 'life-social-v',
            label: 'Energise quickly, then need to retreat',
            dosha: 'vata',
            icon: 'sparkle',
          },
          {
            id: 'life-social-p',
            label: 'Lead the conversation, get bored without depth',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'life-social-k',
            label: 'Stay warm and present, slow to leave',
            dosha: 'kapha',
            icon: 'leaf',
          },
        ],
      },
      {
        id: 'life-routine',
        prompt: 'How do you feel about daily routine?',
        options: [
          {
            id: 'life-routine-v',
            label: 'Crave it but struggle to keep it',
            dosha: 'vata',
            icon: 'wind',
          },
          {
            id: 'life-routine-p',
            label: 'Plan and execute precisely',
            dosha: 'pitta',
            icon: 'flame',
          },
          {
            id: 'life-routine-k',
            label: 'Steady and consistent without much effort',
            dosha: 'kapha',
            icon: 'mountain',
          },
        ],
      },
    ],
  },
]

// ─── Archetypes ──────────────────────────────────────────────────────────

const VATA_IMAGE =
  'https://images.unsplash.com/photo-1507783548227-544c3b8fc065?auto=format&fit=crop&w=1400&q=80'
const PITTA_IMAGE =
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=80'
const KAPHA_IMAGE =
  'https://images.unsplash.com/photo-1530908295418-a12e326966ba?auto=format&fit=crop&w=1400&q=80'
const TRIDOSHIC_IMAGE =
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1400&q=80'

const archetypes: Record<ArchetypeKey, Archetype> = {
  vata: {
    key: 'vata',
    name: 'Vata',
    title: 'The Wanderer',
    sanskrit: 'Vāta',
    essence: 'Air and ether. Light, quick, creative — needs warmth and rhythm to settle.',
    profile:
      'You move through life with a quick, restless intelligence. Your mind generates ideas faster than your body can act on them, and your nervous system is finely tuned — alive to beauty, to subtle shifts, to other people’s moods. At your best, you’re inspired, expressive, and playful. When the wind in you blows too cold, you scatter: thoughts race, sleep frays, the body dries and tightens. The medicine is not stimulation but warmth, oil, and steady ritual. Slow food. Slow mornings. Sesame oil on the skin. Treat regularity not as constraint but as the soil that lets your gifts root.',
    heroImage: VATA_IMAGE,
    imageAlt: 'Soft autumn light falling through leaves — Vata dosha imagery.',
    dailyAnchors: [
      'Eat three warm meals at consistent times — your nervous system reads regularity as safety.',
      'Self-abhyanga: warm sesame oil massage 3–4 times a week before showering.',
      'Bed before 10 pm, ideally with a few minutes of gentle pranayama (Nadi Shodhana).',
      'Choose grounding exercise — yoga, swimming, walking — over intense cardio.',
      'Limit cold drinks and raw food, especially in cool weather or when anxious.',
    ],
    foodsThatNourish: [
      'Warm cooked grains (rice, oats, kitchari)',
      'Stewed vegetables with ghee',
      'Sesame, almond, dates, soaked nuts',
      'Warming spices: ginger, cinnamon, cardamom',
      'Herbal teas with cumin, fennel, ajwain',
    ],
    foodsToLimit: [
      'Cold or carbonated drinks',
      'Dry crackers, popcorn, raw salads in cold weather',
      'Excess caffeine — destabilises your already-quick nervous system',
      'Bitter leafy greens in large amounts',
    ],
    recommendations: {
      productSlugs: ['kesha-thailam', 'mahanarayan-oil', 'ashwagandha-tablets', 'chyawanprash'],
      therapySlugs: ['abhyanga', 'shirodhara'],
    },
  },

  pitta: {
    key: 'pitta',
    name: 'Pitta',
    title: 'The Flame',
    sanskrit: 'Pitta',
    essence: 'Fire and water. Focused, intense, transformative — needs cooling and ease.',
    profile:
      'You are a clear, focused force. Your digestion is strong, your intelligence is sharp, and you are the one in the room who actually finishes things. People come to you because you decide — quickly, precisely, and with conviction. The shadow is heat: when Pitta runs hot, you become critical, perfectionist, and physically inflamed — skin reddens, jaw tightens, sleep gets vivid and broken. The medicine is not less ambition but more coolness. Coconut oil. Moonlight walks. Sweet juicy fruit. Permission to be unproductive sometimes. Learn the difference between effort and effort-with-burn — your body will thank you for it.',
    heroImage: PITTA_IMAGE,
    imageAlt: 'A warm flame against a dark backdrop — Pitta dosha imagery.',
    dailyAnchors: [
      'Eat your largest meal at midday when Pitta — and your agni — peak.',
      'Cool oils on the skin: coconut, sunflower, or our Nalpamaradi for hot weather.',
      'Avoid eating when angry or rushed — emotions imprint on your digestion.',
      'Build in unscheduled time — your fire needs space, not just fuel.',
      'Moonlight, water, and stillness cool you faster than the gym does.',
    ],
    foodsThatNourish: [
      'Sweet, juicy fruits — mango, pear, melon, coconut',
      'Leafy greens, cucumber, fennel, asparagus',
      'Basmati rice, oats, barley',
      'Cooling spices: coriander, mint, cardamom',
      'Milk, ghee, sweet lassi',
    ],
    foodsToLimit: [
      'Spicy and fermented foods, especially in summer',
      'Excess sour fruits, tomatoes, vinegar',
      'Caffeine and alcohol — fuel that adds heat',
      'Eating late at night',
    ],
    recommendations: {
      productSlugs: ['kumkumadi-serum', 'nalpamaradi-turmeric', 'brahmi-ghritam', 'kaishore-guggulu'],
      therapySlugs: ['shirodhara', 'pizhichil'],
    },
  },

  kapha: {
    key: 'kapha',
    name: 'Kapha',
    title: 'The Mountain',
    sanskrit: 'Kapha',
    essence: 'Earth and water. Steady, strong, nurturing — needs movement and dry warmth.',
    profile:
      'You are the steady ground others stand on. Strong-boned, slow to anger, deeply loyal, with a body that holds energy and emotion alike. When Kapha is in balance, you radiate calm presence and physical resilience. When it accumulates, weight settles, mornings grow heavy, the chest congests, motivation thins. The medicine is not rest but movement, dryness, and stimulation. Spice the food. Get sweaty. Switch the route. Resist the pull to sleep in. Your gift is depth, but depth needs current to stay alive — your daily practice should be the act of stirring.',
    heroImage: KAPHA_IMAGE,
    imageAlt: 'A still lotus on calm water — Kapha dosha imagery.',
    dailyAnchors: [
      'Rise before 6 am — Kapha hours (6–10 am) entrench sleepiness in your body.',
      'Vigorous daily movement: brisk walking, cycling, yoga with breath, sweat is medicine.',
      'Dry brushing (garshana) before showering — stimulates lymph and dries excess Kapha.',
      'Eat your lightest meal at night, sometimes skip dinner entirely.',
      'Vary your routine — Kapha thrives on novelty even when it resists it.',
    ],
    foodsThatNourish: [
      'Light grains: barley, millet, buckwheat',
      'Steamed greens, bitter vegetables, sprouts',
      'Apples, pears, pomegranate, dried fruit',
      'Warming pungent spices: ginger, black pepper, cayenne, mustard seed',
      'Honey (raw, never cooked)',
    ],
    foodsToLimit: [
      'Dairy, especially cold milk and cheese',
      'Wheat, heavy oils, deep-fried foods',
      'Sugary or iced drinks',
      'Excess salt — holds water in the tissues',
    ],
    recommendations: {
      productSlugs: ['triphala-churna', 'hingvashtak-churna', 'kaishore-guggulu', 'complete-detox-kit'],
      therapySlugs: ['udwarthanam', 'panchakarma'],
    },
  },

  'vata-pitta': {
    key: 'vata-pitta',
    name: 'Vata-Pitta',
    title: 'Wind & Flame',
    sanskrit: 'Vāta-Pitta',
    essence:
      'Quick and sharp. Creative ideas pushed into reality — but easily burned at both ends.',
    profile:
      'You carry the speed of Vata and the focus of Pitta. You generate ideas and execute them. You learn fast, work hard, and read the room before anyone else does. The cost is overhead: your nervous system runs at a higher frequency than most people’s, and you are equally prone to anxiety (Vata) and irritability (Pitta) when depleted. The work for you is not productivity — you have plenty — but cooling and grounding. Routine. Oil. Cooked food. Permission to be slow. Both the wind and the flame need a container; without one, both consume what they touch, including you.',
    heroImage: PITTA_IMAGE,
    imageAlt: 'Warm light through autumn leaves — Vata-Pitta dosha imagery.',
    dailyAnchors: [
      'Self-abhyanga with cool oils (coconut, sunflower) — cools Pitta, oils Vata.',
      'Three warm, mildly spiced meals at regular times — never skip lunch.',
      'Cap caffeine at one cup, before noon.',
      'Yoga that combines breath + grounding — Nadi Shodhana, Surya Namaskar at moderate pace.',
      'Honour deep rest before you need it — not after.',
    ],
    foodsThatNourish: [
      'Sweet juicy fruits and cooked vegetables',
      'Basmati rice, oats, soaked almonds',
      'Coconut, ghee, fresh dairy',
      'Cooling spices: coriander, fennel, mint',
    ],
    foodsToLimit: [
      'Spicy + dry combinations',
      'Caffeine, alcohol, sour fermented foods',
      'Skipping meals',
    ],
    recommendations: {
      productSlugs: ['brahmi-ghritam', 'kumkumadi-serum', 'ashwagandha-tablets', 'shatavari-gulam'],
      therapySlugs: ['shirodhara', 'abhyanga'],
    },
  },

  'vata-kapha': {
    key: 'vata-kapha',
    name: 'Vata-Kapha',
    title: 'Wind & Mountain',
    sanskrit: 'Vāta-Kapha',
    essence:
      'Quiet creativity. Imaginative and steady — but can swing between scattered and stuck.',
    profile:
      'You hold an unusual pairing — the lightness and creativity of Vata over the deep stillness of Kapha. You are introspective, often artistic, and at your best you bring quiet, original work into the world. The challenge is that your two doshas pull in opposite directions: Vata wants stimulation, Kapha wants rest, and you can oscillate between scattered energy and heavy stuckness within a single day. The medicine is warmth — warm food, warm oil, warm light. And gentle activation: enough movement to keep Kapha flowing, enough ritual to keep Vata grounded. You don’t need to push hard; you need to keep moving slowly and steadily.',
    heroImage: VATA_IMAGE,
    imageAlt: 'Quiet morning light over a still landscape — Vata-Kapha dosha imagery.',
    dailyAnchors: [
      'Wake before 6:30 am — early Kapha hours can entrench heaviness.',
      'Warm oil massage (sesame) followed by a warm shower.',
      'Daily movement, especially in the morning — walking, yoga, light cardio.',
      'Eat warm, cooked food with warming spices.',
      'One creative practice and one grounding practice daily.',
    ],
    foodsThatNourish: [
      'Warm cooked grains and stews',
      'Ginger tea, warming spices (cinnamon, cardamom, black pepper)',
      'Cooked vegetables with ghee',
      'Mung dal, kitchari',
    ],
    foodsToLimit: [
      'Cold or raw foods',
      'Heavy dairy, deep-fried, sugary foods',
      'Iced drinks',
    ],
    recommendations: {
      productSlugs: ['mahanarayan-oil', 'kesha-thailam', 'triphala-churna', 'chyawanprash'],
      therapySlugs: ['abhyanga', 'udwarthanam'],
    },
  },

  'pitta-kapha': {
    key: 'pitta-kapha',
    name: 'Pitta-Kapha',
    title: 'Flame & Mountain',
    sanskrit: 'Pitta-Kapha',
    essence:
      'Powerful and durable. The strongest of the constitutions — but can run hot and heavy.',
    profile:
      'You hold the rare combination of Pitta’s drive and Kapha’s endurance — and this is, frankly, an enviable constitution. You can work long and hard without burning out. Your digestion is strong, your body resilient, your decisions firm. The shadow is inertia paired with heat: when you accumulate, you become stubborn, opinionated, and physically inflamed. Movement is key. Sweat is key. A periodic cleanse is key. Your strength is your foundation, but it asks of you not to coast — your gifts shine brightest when you keep them moving.',
    heroImage: KAPHA_IMAGE,
    imageAlt: 'Sunlight on still water — Pitta-Kapha dosha imagery.',
    dailyAnchors: [
      'Daily vigorous exercise — sweating is non-negotiable.',
      'Eat your lightest meal at night.',
      'Cooling but stimulating foods: bitter greens, cooked apples, pomegranate.',
      'Periodic dietary lightening — kitchari days or seasonal cleanses.',
      'Avoid heavy foods after sunset.',
    ],
    foodsThatNourish: [
      'Bitter and astringent greens',
      'Pomegranate, apple, pear, berries',
      'Mung beans, lentils, sprouts',
      'Cooling spices: coriander, mint, fennel',
    ],
    foodsToLimit: [
      'Heavy red meats, fried foods',
      'Sugary or iced drinks',
      'Excess salt, dairy, wheat',
    ],
    recommendations: {
      productSlugs: ['triphala-churna', 'kumkumadi-serum', 'nalpamaradi-turmeric', 'kaishore-guggulu'],
      therapySlugs: ['udwarthanam', 'pizhichil', 'panchakarma'],
    },
  },

  tridoshic: {
    key: 'tridoshic',
    name: 'Tridoshic',
    title: 'In Balance',
    sanskrit: 'Sama-Prakriti',
    essence:
      'A rare equilibrium. All three forces in roughly equal measure — strength sits in the rhythm itself.',
    profile:
      'You scored close-to-evenly across all three doshas — a constitutional balance that classical texts call sama-prakriti, and which is genuinely uncommon. The blessing is range: you can adapt to any climate, food, or season more easily than most. The challenge is that without a single dominant signal, your imbalances can be subtle and harder to read. The practice for you is rhythm itself — ritucharya, the seasonal routine. Eat with the season. Move with the season. Sleep with the sun. Your gift is harmony; your work is to keep the instrument tuned.',
    heroImage: TRIDOSHIC_IMAGE,
    imageAlt: 'Three botanical elements in balanced composition — tridoshic imagery.',
    dailyAnchors: [
      'Honour the seasons — adjust food, oils, and exercise as the year turns.',
      'Daily oil massage with a seasonal oil (sesame in winter, coconut in summer).',
      'Eat with the rhythm of the sun — breakfast light, lunch full, dinner gentle.',
      'A short daily meditation — your nervous system benefits enormously.',
      'Annual seasonal cleanse (spring and autumn) to keep the channels clear.',
    ],
    foodsThatNourish: [
      'Whatever is local and in season',
      'A mix of all six tastes (sweet, sour, salty, bitter, pungent, astringent)',
      'Freshly prepared food, eaten warm',
      'A wide rotation of grains, legumes, and vegetables',
    ],
    foodsToLimit: [
      'Processed and packaged foods',
      'Leftovers — your body loves freshness',
      'Excess of any single taste',
    ],
    recommendations: {
      productSlugs: ['triphala-churna', 'chyawanprash', 'daily-wellness-combo'],
      therapySlugs: ['abhyanga', 'panchakarma'],
    },
  },
}

// ─── Export ──────────────────────────────────────────────────────────────

export const prakritiQuiz: PrakritiQuizDefinition = {
  slug: 'prakriti',
  title: 'Prakriti Assessment',
  sanskrit: 'Prakṛti — your nature',
  tagline:
    'Discover your Ayurvedic constitution. 24 questions, around 5 minutes — and a personal profile from our Vaidyas to keep.',
  estimatedMinutes: 5,
  sections,
  archetypes,
}

export const TOTAL_QUESTIONS = sections.reduce(
  (sum, section) => sum + section.questions.length,
  0
)
