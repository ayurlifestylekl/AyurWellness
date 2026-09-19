import {
  Sparkles,
  Flower2,
  Bone,
  Shield,
  Salad,
  HeartPulse,
  Moon,
  Droplets,
} from 'lucide-react'
import type { Category } from '@/types/content'

/**
 * The 8 "Standard Ayurvedic" shop concerns shown as circular tiles.
 * Images point to Unsplash (configured in next.config.mjs).
 */
export const categories: Category[] = [
  {
    slug: 'hair-care',
    label: 'Hair Care',
    icon: Sparkles,
    image:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=hair-care',
  },
  {
    slug: 'skin-care',
    label: 'Skin Care',
    icon: Flower2,
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=skin-care',
  },
  {
    slug: 'pain-relief',
    label: 'Pain Relief',
    icon: Bone,
    image:
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=pain-relief',
  },
  {
    slug: 'immunity',
    label: 'Immunity',
    icon: Shield,
    image:
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=immunity',
  },
  {
    slug: 'digestion',
    label: 'Digestion',
    icon: Salad,
    image:
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=digestion',
  },
  {
    slug: 'womens-wellness',
    label: "Women's Wellness",
    icon: HeartPulse,
    image:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=womens-wellness',
  },
  {
    slug: 'stress-relief',
    label: 'Stress Relief',
    icon: Moon,
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=stress-relief',
  },
  {
    slug: 'detox-cleanse',
    label: 'Detox & Cleanse',
    icon: Droplets,
    image:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
    href: '/products?category=detox-cleanse',
  },
]
