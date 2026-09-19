import { Award, BadgeCheck, Leaf } from 'lucide-react'
import type { TrustItem } from '@/types/content'

export const trustItems: TrustItem[] = [
  {
    id: 'heritage',
    title: 'Ancient Heritage',
    subtitle: 'Rooted in Ayurveda’s 5,000-year-old healing tradition, brought authentically to Brickfields and the Klang Valley.',
    icon: Award,
  },
  {
    id: 'certified',
    title: 'Certified Vaidya',
    subtitle: 'Every treatment supervised by our Vaidyas, trained in classical Ayurveda with 16+ years clinical experience.',
    icon: BadgeCheck,
  },
  {
    id: 'authentic',
    title: '100% Authentic Formulas',
    subtitle: 'Pure herbs and therapeutic oils sourced from trusted Ayurvedic suppliers for genuine healing.',
    icon: Leaf,
  },
]
