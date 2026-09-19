import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CategoryPageHeader from '@/components/treatments/CategoryPageHeader'
import FreeConsultationBlock from '@/components/treatments/FreeConsultationBlock'
import TherapyGrid from '@/components/treatments/TherapyGrid'
import { createClient } from '@/lib/supabase/server'
import { getCategoryWithTreatments } from '@/lib/storefront/treatments'
import { sortByDuration } from '@/lib/treatment-order'
import type { TreatmentCategory, TreatmentSummary } from '@/types/treatments'

// Server-rendered on demand: these pages read auth cookies (Supabase server
// client), which is incompatible with static/ISR rendering and 500s in prod.
export const dynamic = 'force-dynamic'

interface CategoryPageData extends TreatmentCategory {
  treatments: TreatmentSummary[]
}

async function loadCategory(slug: string): Promise<CategoryPageData | null> {
  try {
    const supabase = await createClient()
    return await getCategoryWithTreatments(supabase, slug)
  } catch (err) {
    console.error(`[treatments/${slug}] catalogue fetch failed:`, err)
    return null
  }
}

export async function generateStaticParams(): Promise<Array<{ categorySlug: string }>> {
  // Categories are rendered on-demand (dynamicParams = true); skip build-time
  // enumeration to avoid a DB round-trip during the build.
  return []
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string }
}): Promise<Metadata> {
  const category = await loadCategory(params.categorySlug)
  if (!category) {
    return {
      title: 'Category not found',
      robots: { index: false, follow: true },
    }
  }
  return {
    title: `${category.title} — Ayurvedic Wellness Centre`,
    description: category.description ?? undefined,
    alternates: { canonical: `/treatments/${category.slug}` },
    openGraph: {
      title: `${category.title} — Ayurvedic Wellness Centre`,
      description: category.description ?? undefined,
      type: 'website',
      url: `https://ayurvedawellness.com.my/treatments/${category.slug}`,
    },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { categorySlug: string }
}) {
  const category = await loadCategory(params.categorySlug)
  if (!category) notFound()

  return (
    <>
      <section className="relative overflow-hidden bg-cream pb-12">
        <CategoryPageHeader
          title={category.title}
          description={category.description ?? null}
          order={category.order}
          treatmentCount={category.treatments.length}
        />
        <TherapyGrid
          // CATEGORY_BY_SLUG_QUERY always projects slug; non-null assertion is safe here.
          categorySlug={category.slug!}
          treatments={sortByDuration(category.treatments)}
        />
      </section>
      <FreeConsultationBlock />
    </>
  )
}
