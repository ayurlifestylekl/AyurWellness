import type { Metadata } from 'next'
import ComingSoon from '@/components/ui/ComingSoon'

export const metadata: Metadata = {
  title: 'The Apothecary — Coming Soon | Ayurvedic Wellness Centre',
  description:
    'Our authentic Ayurvedic apothecary is coming soon — hand-blended herbal oils, churnas and wellness kits, sourced from trusted Ayurvedic suppliers.',
  alternates: { canonical: '/products' },
  robots: { index: true, follow: true },
}

export default function ProductsPage() {
  return (
    <ComingSoon
      eyebrow="The Apothecary"
      title="Coming Soon"
      subtitle="Our hand-blended traditional Ayurvedic formulas — herbal oils, churnas and wellness kits — are being prepared with the same care as everything we do. In the meantime, book a consultation to begin your journey."
      primaryHref="/book/consultation"
      primaryLabel="Book a Consultation"
    />
  )
}
