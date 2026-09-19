import { Truck, Gift, Layers } from 'lucide-react'
import type { PromoBanner } from '@/types/content'

export const promos: PromoBanner[] = [
  {
    id: 'shipping',
    headline: 'Free Shipping',
    sub: 'On all orders over RM150',
    icon: Truck,
    accent: 'primary',
  },
  {
    id: 'first-order',
    headline: 'First-Time 10% Off',
    sub: 'Use code WELCOME10 at checkout',
    icon: Gift,
    accent: 'accent',
  },
  {
    id: 'bundles',
    headline: 'Bundle & Save 25%',
    sub: 'Curated combos for every concern',
    icon: Layers,
    accent: 'secondary',
  },
]
