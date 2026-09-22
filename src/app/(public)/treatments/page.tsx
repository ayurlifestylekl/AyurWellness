import type { Metadata } from 'next'

import CategoryGrid from '@/components/treatments/CategoryGrid'
import FreeConsultationBlock from '@/components/treatments/FreeConsultationBlock'
import TreatmentsHero from '@/components/treatments/TreatmentsHero'
import { getAllCategories, toTreatmentCategory, totalTreatmentCount } from '@/data/treatments'
import { CLINIC_DOMAIN, CLINIC_NAME } from '@/lib/clinic'

export const metadata: Metadata = {
  title: 'Treatments — Authentic Traditional Ayurveda Therapies',
  description:
    'Browse the full library of authentic traditional Ayurveda therapies offered at Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur — face care, massage, stress relief, joint care, rehabilitation, kids, and more. Free consultation with our therapists.',
  alternates: { canonical: '/treatments' },
  openGraph: {
    title: `Treatments — ${CLINIC_NAME}`,
    description:
      'Authentic Ayurveda therapies across the Centre catalogue. Personal protocols designed by KKM-registered therapists in Brickfields, KL.',
    url: `https://${CLINIC_DOMAIN}/treatments`,
    type: 'website',
  },
}

export default function TreatmentsPage() {
  const categories = getAllCategories().map(toTreatmentCategory)

  return (
    <>
      <TreatmentsHero therapyCount={totalTreatmentCount} />
      <CategoryGrid categories={categories} />
      <FreeConsultationBlock />
    </>
  )
}
