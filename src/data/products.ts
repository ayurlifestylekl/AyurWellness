import type { Product } from '@/types/content'

/**
 * The 5 real client-supplied products, transcribed from their product spec
 * PDFs (name, description, ingredients, dosage, contraindications, SKU).
 * price_rm and stock_qty are not in the source specs — the client hasn't
 * finalised pricing yet, so these stay 0 and every product reads as
 * "Coming Soon" across the site rather than showing a fabricated price.
 */
export const products: Product[] = [
  {
    id: 'dandra-care-oil',
    name: 'Dandra Care Oil',
    tagline: 'Soothes itchy, flake-prone scalp and supports healthy hair',
    description:
      'Dandra Care Oil by Ayurveda Wellness Centre is a modified, Ayurvedic topical formulation designed to support scalp hygiene and promote overall hair wellness naturally. Prepared using traditional Ayurvedic herbs and medicated oil bases, this formulation is valued for helping maintain a balanced scalp environment, supporting scalp comfort, and encouraging healthy hair care practices. This formulation helps support the scalp in managing Darunaka (dandruff), scalp discomfort, and visible flakes associated with environmental and lifestyle factors, while balancing aggravated Vata and Kapha doshas in the scalp. Net volume 200ml.',
    category: 'hair-care',
    priceRm: 0,
    image: '/products/dandra-care-oil.jpg',
    sku: 'AWC-DANDRA-200',
    stockQty: 0,
    isBundle: false,
    createdAt: '2026-09-01T00:00:00Z',
    ingredients: [
      'Keratailam / Tila Taila (sesame oil base)',
      'Coconut Oil',
      'Karanja (Pongamia pinnata)',
      'Datura Leaf (Thorn Apple) extract',
      'Bermuda Grass (Durva)',
      'Indian Coral Tree (Paribhadra)',
      'Nimba (Neem)',
    ],
    dose:
      'Apply an adequate quantity over the scalp. Gently massage with fingertips in circular motion for 5–10 minutes to improve local blood circulation. Leave on the scalp for 30–45 minutes, then rinse thoroughly with a mild herbal hair wash powder or sulfate-free herbal shampoo and lukewarm water. Use 2–3 times a week, or as directed by an Ayurveda vaidya.',
    useCases: ['anti-dandruff', 'scalp-care', 'hair-oil'],
  },
  {
    id: 'balashwagandhaadi-tailam',
    name: 'Balashwagandhaadi Tailam',
    tagline: 'Muscle strengthening & joint pain relief oil for recovery',
    description:
      'Formulated according to the traditional text Yogaratnakaram, Balashwagandhaadi Tailam is an authentic Ayurvedic body oil crafted to restore physical strength, support neural health, and ease joint discomfort. It harmonises Vata and Pitta doshas, making it an ideal remedy for physical exhaustion, post-illness rehabilitation, and general vitality. Ideal for post-illness, post-injury or postpartum recovery, athletes and fitness enthusiasts, elderly individuals seeking joint and muscle support, and anyone experiencing persistent tiredness, stress or sleep disruption. Note: prepared using classical methods incorporating curd (dairy) — not suitable for vegans. Net volume 200ml.',
    category: 'pain-relief',
    priceRm: 0,
    image: '/products/balashwagandhaadi-tailam.jpg',
    sku: 'AWC-BALASHWA-200',
    stockQty: 0,
    isBundle: false,
    createdAt: '2026-09-01T00:00:00Z',
    ingredients: [
      'Taila / Sesamum indicum oil (base)',
      'Mastu (curd whey — liquid medium)',
      'Bala (Sida cordifolia)',
      'Ashwagandha (Withania somnifera)',
      'Laksha (Laccifer lacca)',
      'fine herbal paste extracts',
    ],
    dose:
      'Warm the oil slightly. Apply to the body or affected area and massage gently. Leave on for 30–45 minutes before a warm bath. For age above 6 years. If the oil thickens or solidifies in colder temperatures, warm the container gently in warm water (98–105°F) before use.',
    useCases: ['muscle-recovery', 'joint-pain', 'massage-oil'],
  },
  {
    id: 'lakshadi-kera-tailam',
    name: 'Lakshadi Kera Tailam',
    tagline: "Kerala's trusted traditional baby & kids massage oil",
    description:
      'Rooted in the ancient text Ashtanga Hridaya, Lakshadi Kera Tailam is a time-honoured herbal massage oil crafted for growing babies and adults alike. Traditionally used in body massage (Abhyanga) for children to promote healthy growth and immunity, it deeply moisturises and hydrates dry skin, improves skin texture, and soothes mild irritation, while supporting muscle health, tissue recovery and physical vitality (Balya). It also pacifies aggravated Pitta and Vata doshas. Safe for infants from the second month, and equally used by adults for full-body hydration, stress relief and youthful skin suppleness. Net volume 200ml.',
    category: 'skin-care',
    priceRm: 0,
    image: '/products/lakshadi-kera-tailam.jpg',
    sku: 'AWC-LAKSHADI-200',
    stockQty: 0,
    isBundle: false,
    createdAt: '2026-09-01T00:00:00Z',
    ingredients: [
      'Kera Taila / Coconut Oil (Cocos nucifera — base)',
      'Laksha (Laccifer lacca)',
      'Ashwagandha (Withania somnifera)',
      'Nisa / Haridra (Curcuma longa — turmeric)',
      'Devadaru (Cedrus deodara)',
    ],
    dose:
      'Apply a required quantity over the head (Moordhataila) or body (Abhyanga). Massage gently in circular motions. Leave on for 15–30 minutes before washing off with lukewarm water and a mild cleanser. Dosage as directed by an Ayurvedic practitioner.',
    useCases: ['baby-massage-oil', 'kids-care', 'skin-nourishing'],
  },
  {
    id: 'himasagara-tailam',
    name: 'Himasagara Tailam',
    tagline: 'Classical oil for strength, restful sleep and joint comfort',
    description:
      "Himasagara Tailam is a medicated oil described in the classical text Bhaishajya Ratnavali, explained in the context of Vatavyadhi. Mostly prescribed during convalescence, massage with this oil helps regain strength and vitality and is used in general weakness and debility. Applied over the head it supports good sleep and helps reduce stress; regular use helps bring down excess body heat and reduce burning sensation of the skin. It is one of the Ayurvedic oils used for Sirodhaara to improve sleep, and also supports recovery from bone and joint injuries, frozen joints, muscle wasting and locomotor impairments from trauma or over-exertion. Balances Vata and Pitta doshas.",
    category: 'stress-relief',
    priceRm: 0,
    image: '/products/himasagara-tailam.jpg',
    sku: 'AWC-HIMASAGARA-200',
    stockQty: 0,
    isBundle: false,
    createdAt: '2026-09-01T00:00:00Z',
    ingredients: [
      'Tila Taila / Sesame Oil',
      'Narikela Ksheera (coconut milk)',
      "Go-Ksheera (cow's milk)",
      'Shatavari (Asparagus racemosus)',
      'Chandana (Santalum album)',
      'Jatamansi (Nardostachys jatamansi)',
      'Madhuka (Glycyrrhiza glabra)',
      'Amalaki (Emblica officinalis)',
      'Gokshura (Tribulus terrestris)',
    ],
    dose:
      'For body: apply a sufficient quantity over the affected area or full body for Abhyanga (massage) with gentle strokes for 10 minutes; leave on for 15–30 minutes before washing off with lukewarm water. For scalp: gentle massage for 10–15 minutes for stress and sleep support.',
    useCases: ['sleep-support', 'stress-relief', 'sirodhaara', 'joint-stiffness'],
  },
  {
    id: 'nalpamaradi-body-lotion',
    name: 'AWC Nalpamaradi Body Lotion',
    tagline: 'Deep hydration & daily nourishment — non-greasy, fast-absorbing',
    description:
      'Nalpamaradi Body Lotion is a solution for dry, rough, scaly and itchy skin. Infused with Nalpamaradi Thailam and rich herbs, it penetrates deeply to replenish lost moisture and ease tightness, while forming a lightweight protective barrier that locks in hydration and keeps daily flakiness away. It calms persistent discomfort and itching, refines uneven or scaly texture, and its nutrient-dense blend of sesame oil, turmeric and botanicals supports long-term radiance and skin resilience. Combines the richness of Ayurvedic tradition with selected ingredients for gentle, effective daily skincare. Net volume 100ml.',
    category: 'skin-care',
    priceRm: 0,
    image: '/products/nalpamaradi-body-lotion.jpg',
    sku: 'AWC-NALPAMARADI-100',
    stockQty: 0,
    isBundle: false,
    createdAt: '2026-09-01T00:00:00Z',
    ingredients: [
      'Nalpamaradi Thailam (base brightening oil)',
      'Turmeric (Haridra)',
      'Vetiver (Usira)',
      'Aloe Vera',
      'Cocoa Butter',
      'Shea Butter',
      'Vitamin E',
      'Sesame Oil',
    ],
    dose:
      'After showering or bathing, towel dry gently. Dispense a generous amount into your palm and apply all over the body, focusing on areas prone to dryness, roughness or itchiness. Massage in using circular motions until fully absorbed. Use daily, especially after bathing, for best results.',
    useCases: ['body-lotion', 'daily-hydration', 'skin-brightening'],
  },
]
