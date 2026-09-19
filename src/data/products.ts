import type { Product } from '@/types/content'

/**
 * Full product catalog for the /products page.
 * Covers all 8 shop categories + 2 combo bundles.
 * Data lives here until Supabase is wired in.
 */
export const products: Product[] = [
  /* ── Hair Care ──────────────────────────────── */
  {
    id: 'kesha-thailam',
    name: 'Kesha Thailam',
    tagline: 'Cooling Hair & Scalp Oil',
    description:
      'Hand-blended in small batches with brahmi, bhringraj and amla. Calms the scalp, deepens sleep, and restores natural shine over six weeks of daily use.',
    category: 'hair-care',
    priceRm: 89,
    badge: 'BESTSELLER',
    image:
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    sku: 'KT-001',
    stockQty: 42,
    isBundle: false,
    createdAt: '2025-08-15T00:00:00Z',
    doshas: ['vata', 'pitta'],
    useCases: ['dry-hair', 'scalp-heat', 'sleep'],
  },
  {
    id: 'neelibhringadi-oil',
    name: 'Neelibhringadi Kera Thailam',
    tagline: 'Intense Hair Growth & Root Strengthener',
    description:
      'A potent Ayurvedic formulation with indigo, bhringraj and coconut milk base. Traditionally used for premature greying, hair thinning and dandruff control.',
    category: 'hair-care',
    priceRm: 79,
    image:
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
    sku: 'NB-002',
    stockQty: 35,
    isBundle: false,
    createdAt: '2025-11-20T00:00:00Z',
    doshas: ['vata', 'pitta'],
    useCases: ['hair-thinning', 'premature-greying'],
  },

  /* ── Skin Care ──────────────────────────────── */
  {
    id: 'kumkumadi-serum',
    name: 'Kumkumadi Serum',
    tagline: 'Saffron Glow Elixir',
    description:
      'Luxurious night serum infused with saffron, sandalwood and lotus extract. Fades dark spots, evens skin tone and imparts a natural radiance within weeks.',
    category: 'skin-care',
    priceRm: 159,
    oldPriceRm: 199,
    badge: 'SALE',
    image:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80',
    sku: 'KS-003',
    stockQty: 18,
    isBundle: false,
    createdAt: '2025-09-10T00:00:00Z',
    doshas: ['pitta', 'vata'],
    useCases: ['dark-spots', 'uneven-tone'],
  },
  {
    id: 'nalpamaradi-turmeric',
    name: 'Nalpamaradi Thailam',
    tagline: 'Turmeric Brightening Body Oil',
    description:
      'Classical Ayurvedic body oil with wild turmeric, vetiver and sesame base. Evens skin tone, reduces blemishes and leaves a warm golden glow after abhyanga.',
    category: 'skin-care',
    priceRm: 110,
    badge: 'NEW',
    image:
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=800&q=80',
    sku: 'NT-004',
    stockQty: 28,
    isBundle: false,
    createdAt: '2026-02-01T00:00:00Z',
    doshas: ['pitta', 'kapha'],
    useCases: ['blemishes', 'body-glow'],
  },

  /* ── Pain Relief ────────────────────────────── */
  {
    id: 'mahanarayan-oil',
    name: 'Mahanarayan Oil',
    tagline: 'Joint & Muscle Relief',
    description:
      'A warm, deeply penetrating oil with 50+ Ayurvedic herbs. Used for centuries for joint stiffness, muscular pain and post-exercise recovery.',
    category: 'pain-relief',
    priceRm: 95,
    image:
      'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=800&q=80',
    sku: 'MN-005',
    stockQty: 30,
    isBundle: false,
    createdAt: '2025-07-20T00:00:00Z',
    doshas: ['vata', 'kapha'],
    useCases: ['joint-pain', 'muscle-stiffness'],
  },
  {
    id: 'kottamchukkadi-thailam',
    name: 'Kottamchukkadi Thailam',
    tagline: 'Deep Tissue Pain Oil',
    description:
      'Potent medicated oil for chronic joint pain, sciatica and sports injuries. Prepared with dry ginger, devil pepper and sesame oil base for deep warming action.',
    category: 'pain-relief',
    priceRm: 85,
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    sku: 'KC-006',
    stockQty: 22,
    isBundle: false,
    createdAt: '2025-12-05T00:00:00Z',
    doshas: ['vata', 'kapha'],
    useCases: ['sciatica', 'sports-injury'],
  },

  /* ── Digestion ──────────────────────────────── */
  {
    id: 'triphala-churna',
    name: 'Triphala Churna',
    tagline: 'Daily Digestive Cleanse',
    description:
      'The cornerstone of Ayurvedic wellness — three fruits (amla, haritaki, bibhitaki) in precise ratio for gentle daily detoxification and bowel regularity.',
    category: 'digestion',
    priceRm: 45,
    image:
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80',
    sku: 'TC-007',
    stockQty: 55,
    isBundle: false,
    createdAt: '2025-06-01T00:00:00Z',
    doshas: ['vata', 'pitta', 'kapha'],
    useCases: ['daily-cleanse', 'bowel-regularity'],
  },
  {
    id: 'hingvashtak-churna',
    name: 'Hingvashtak Churna',
    tagline: 'Gas & Bloating Relief Blend',
    description:
      'An ancient eight-ingredient formula with asafoetida, cumin and black pepper. Kindles digestive fire, relieves bloating and supports healthy appetite.',
    category: 'digestion',
    priceRm: 42,
    image:
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80',
    sku: 'HC-008',
    stockQty: 40,
    isBundle: false,
    createdAt: '2025-10-15T00:00:00Z',
    doshas: ['vata', 'kapha'],
    useCases: ['bloating', 'low-appetite'],
  },

  /* ── Stress Relief ──────────────────────────── */
  {
    id: 'ashwagandha-tablets',
    name: 'Ashwagandha',
    tagline: 'Stress & Vitality Support',
    description:
      'Premium-grade KSM-66 ashwagandha root extract. Clinically shown to lower cortisol, support deep sleep and restore energy without stimulants.',
    category: 'stress-relief',
    priceRm: 75,
    badge: 'NEW',
    image:
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80',
    sku: 'AW-009',
    stockQty: 60,
    isBundle: false,
    createdAt: '2026-01-10T00:00:00Z',
    doshas: ['vata', 'kapha'],
    useCases: ['stress', 'sleep', 'vitality'],
  },
  {
    id: 'brahmi-ghritam',
    name: 'Brahmi Ghritam',
    tagline: 'Mind Clarity & Focus',
    description:
      'Medicated ghee infused with bacopa monnieri and calamus root. Nourishes neural tissue, sharpens memory and promotes calm, sustained mental clarity.',
    category: 'stress-relief',
    priceRm: 68,
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    sku: 'BG-010',
    stockQty: 25,
    isBundle: false,
    createdAt: '2025-11-01T00:00:00Z',
    doshas: ['pitta', 'vata'],
    useCases: ['mental-clarity', 'memory', 'focus'],
  },

  /* ── Immunity ───────────────────────────────── */
  {
    id: 'chyawanprash',
    name: 'Chyawanprash',
    tagline: 'Daily Immunity Rasayana',
    description:
      'The king of Ayurvedic tonics — amla-rich herbal jam with 40+ botanicals. Builds ojas (immunity), supports respiratory health and rejuvenates all tissues.',
    category: 'immunity',
    priceRm: 55,
    badge: 'BESTSELLER',
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
    sku: 'CP-011',
    stockQty: 48,
    isBundle: false,
    createdAt: '2025-08-01T00:00:00Z',
    doshas: ['vata', 'pitta'],
    useCases: ['immunity', 'energy', 'respiratory'],
  },

  /* ── Women's Wellness ───────────────────────── */
  {
    id: 'shatavari-gulam',
    name: 'Shatavari Gulam',
    tagline: 'Hormonal Balance & Vitality',
    description:
      'Nourishing herbal jam formulated for women\'s health. Supports hormonal balance, menstrual comfort and reproductive vitality through all life stages.',
    category: 'womens-wellness',
    priceRm: 65,
    image:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    sku: 'SG-012',
    stockQty: 32,
    isBundle: false,
    createdAt: '2025-12-20T00:00:00Z',
    doshas: ['pitta', 'vata'],
    useCases: ['hormonal-balance', 'menstrual'],
  },

  /* ── Detox & Cleanse ────────────────────────── */
  {
    id: 'kaishore-guggulu',
    name: 'Kaishore Guggulu',
    tagline: 'Blood Purifier & Detox Tablets',
    description:
      'Classical purification formula with guggulu resin, triphala and guduchi. Clears metabolic toxins, supports healthy uric acid levels and promotes clear skin.',
    category: 'detox-cleanse',
    priceRm: 52,
    image:
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80',
    sku: 'KG-013',
    stockQty: 38,
    isBundle: false,
    createdAt: '2026-01-25T00:00:00Z',
    doshas: ['pitta', 'kapha'],
    useCases: ['detox', 'skin-clarity', 'uric-acid'],
  },

  /* ── Bundles / Combos ───────────────────────── */
  {
    id: 'complete-detox-kit',
    name: 'Complete Detox Kit',
    tagline: 'Triphala + Kaishore + Chyawanprash',
    description:
      'Our most popular cleanse bundle — a 30-day protocol combining Triphala Churna for digestion, Kaishore Guggulu for blood purification and Chyawanprash for immune rebuilding. Save RM 22 vs individual purchase.',
    category: 'detox-cleanse',
    priceRm: 130,
    oldPriceRm: 152,
    badge: 'COMBO',
    image:
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=800&q=80',
    sku: 'BDL-014',
    stockQty: 15,
    isBundle: true,
    createdAt: '2026-03-01T00:00:00Z',
    doshas: ['pitta', 'kapha'],
    useCases: ['detox', 'cleanse'],
  },
  {
    id: 'daily-wellness-combo',
    name: 'Daily Wellness Combo',
    tagline: 'Ashwagandha + Brahmi + Chyawanprash',
    description:
      'Your daily Ayurvedic wellness stack — stress relief, mental clarity and immune support in one bundle. Three bestsellers at a combined savings of RM 18.',
    category: 'immunity',
    priceRm: 180,
    oldPriceRm: 198,
    badge: 'COMBO',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    sku: 'BDL-015',
    stockQty: 20,
    isBundle: true,
    createdAt: '2026-03-10T00:00:00Z',
    doshas: ['vata', 'pitta', 'kapha'],
    useCases: ['daily-wellness', 'stress', 'immunity'],
  },
]
