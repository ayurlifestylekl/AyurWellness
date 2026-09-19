import type { Metadata } from 'next'
import ComingSoon from '@/components/ui/ComingSoon'

export const metadata: Metadata = {
  title: 'Treatments — Coming Soon | Ayurvedic Wellness Centre',
  description:
    'Our full library of authentic traditional Ayurveda therapies is coming soon. In the meantime, book a consultation with our Vaidyas.',
  alternates: { canonical: '/treatments' },
  robots: { index: true, follow: true },
}

export default function TreatmentsPage() {
  return (
    <ComingSoon
      eyebrow="Therapies"
      title="Coming Soon"
      subtitle="Our full library of authentic traditional Ayurveda therapies — face care, massage, stress relief, joint care and more — is being prepared with the same care as everything we do. In the meantime, book a consultation to begin your journey."
      primaryHref="/book/consultation"
      primaryLabel="Book a Consultation"
    />
  )
}
