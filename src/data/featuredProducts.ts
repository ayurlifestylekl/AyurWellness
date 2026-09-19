import type { FeaturedProduct } from '@/types/content'

/**
 * Real client-supplied products, transcribed from their product spec PDFs.
 * priceRm is a placeholder (0) — these are pre-launch, shown as
 * "Coming Soon" / "Notify Me" until pricing + stock are finalised.
 */
export const featuredProducts: FeaturedProduct[] = [
  {
    id: 'dandra-care-oil',
    name: 'Dandra Care Oil',
    tagline: 'Anti-Dandruff Scalp Oil',
    category: 'Hair Care',
    priceRm: 0,
    image: '/products/dandra-care-oil.jpg',
    description:
      'A traditional Ayurvedic scalp oil formulated with Karanja, neem, Durva and Datura leaf extract to support scalp hygiene, ease flakiness and encourage healthy hair care practices. Net volume 200ml.',
  },
  {
    id: 'balashwagandhaadi-tailam',
    name: 'Balashwagandhaadi Tailam',
    tagline: 'Muscle & Joint Recovery Oil',
    category: 'Pain Relief',
    priceRm: 0,
    image: '/products/balashwagandhaadi-tailam.jpg',
    description:
      'Formulated per the classical text Yogaratnakaram with Bala, Ashwagandha and Laksha, this body oil is crafted to restore strength, ease joint discomfort and support post-illness or post-injury recovery. Net volume 200ml.',
  },
  {
    id: 'lakshadi-kera-tailam',
    name: 'Lakshadi Kera Tailam',
    tagline: 'Baby & Kids Massage Oil',
    category: 'Skin Care',
    priceRm: 0,
    image: '/products/lakshadi-kera-tailam.jpg',
    description:
      "Kerala's trusted traditional massage oil from the Ashtanga Hridaya, blending coconut oil, Laksha, Ashwagandha and turmeric to nourish growing skin and support healthy muscle development. Safe from the second month. Net volume 200ml.",
  },
  {
    id: 'himasagara-tailam',
    name: 'Himasagara Tailam',
    tagline: 'Sleep & Joint Comfort Oil',
    category: 'Stress Relief',
    priceRm: 0,
    image: '/products/himasagara-tailam.jpg',
    description:
      'A classical oil from the Bhaishajya Ratnavali, blended with Shatavari, sandalwood and Jatamansi — traditionally used for Sirodhaara to support restful sleep and ease joint stiffness. Net volume 200ml.',
  },
  {
    id: 'nalpamaradi-body-lotion',
    name: 'AWC Nalpamaradi Body Lotion',
    tagline: 'Daily Hydration Lotion',
    category: 'Skin Care',
    priceRm: 0,
    image: '/products/nalpamaradi-body-lotion.jpg',
    description:
      'Infused with Nalpamaradi Thailam, turmeric, aloe vera and shea butter to deeply replenish dry, rough skin and lock in daily hydration — lightweight and fast-absorbing. Net volume 100ml.',
  },
]
