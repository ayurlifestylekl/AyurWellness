import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CategoryPageHeader from '@/components/treatments/CategoryPageHeader'
import FreeConsultationBlock from '@/components/treatments/FreeConsultationBlock'
import TherapyGrid from '@/components/treatments/TherapyGrid'
import {
  getAllCategories,
  getCategoryBySlug,
  getTreatmentsByCategorySlug,
  sortByDuration,
  toTreatmentSummary,
} from '@/data/treatments'
import { CLINIC_DOMAIN, CLINIC_NAME } from '@/lib/clinic'

// Static catalogue — every category is known at build time.
export async function generateStaticParams(): Promise<Array<{ categorySlug: string }>> {
  return getAllCategories().map((c) => ({ categorySlug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string }
}): Promise<Metadata> {
  const category = getCategoryBySlug(params.categorySlug)
  if (!category) {
    return {
      title: 'Category not found',
      robots: { index: false, follow: true },
    }
  }
  const description = `Explore ${category.title} at ${CLINIC_NAME} — ${category.treatmentCount} authentic Ayurveda ${category.treatmentCount === 1 ? 'therapy' : 'therapies'} in Brickfields, Kuala Lumpur.`
  return {
    title: `${category.title} — ${CLINIC_NAME}`,
    description,
    alternates: { canonical: `/treatments/${category.slug}` },
    openGraph: {
      title: `${category.title} — ${CLINIC_NAME}`,
      description,
      type: 'website',
      url: `https://${CLINIC_DOMAIN}/treatments/${category.slug}`,
    },
  }
}

export default function CategoryPage({
  params,
}: {
  params: { categorySlug: string }
}) {
  const category = getCategoryBySlug(params.categorySlug)
  if (!category) notFound()

  const treatments = sortByDuration(getTreatmentsByCategorySlug(category.slug)).map(
    toTreatmentSummary,
  )

  return (
    <>
      <section className="relative overflow-hidden bg-cream pb-12">
        <CategoryPageHeader
          title={category.title}
          description={null}
          order={category.order}
          treatmentCount={treatments.length}
        />
        <TherapyGrid categorySlug={category.slug} treatments={treatments} />
      </section>
      <FreeConsultationBlock />
    </>
  )
}
