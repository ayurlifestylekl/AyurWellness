import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import BookingSidebar from '@/components/treatments/BookingSidebar'
import FreeConsultationBlock from '@/components/treatments/FreeConsultationBlock'
import MobileBookingBar from '@/components/treatments/MobileBookingBar'
import RelatedTherapies from '@/components/treatments/RelatedTherapies'
import TherapyBenefits from '@/components/treatments/TherapyBenefits'
import TherapyContraindications from '@/components/treatments/TherapyContraindications'
import TherapyGallery from '@/components/treatments/TherapyGallery'
import TherapyHero from '@/components/treatments/TherapyHero'
import TherapyMarginalia from '@/components/treatments/TherapyMarginalia'
import TherapyMidCTA from '@/components/treatments/TherapyMidCTA'
import TherapyPager from '@/components/treatments/TherapyPager'
import TherapyProcedure from '@/components/treatments/TherapyProcedure'
import TherapyStickyBar from '@/components/treatments/TherapyStickyBar'
import TherapySwitcher from '@/components/treatments/TherapySwitcher'
import { portableTextComponents } from '@/components/blog/PortableTextComponents'
import { urlForImage } from '@/sanity/image'
import { createClient } from '@/lib/supabase/server'
import {
  getTreatmentBySlug,
  getTreatmentSiblings,
} from '@/lib/storefront/treatments'
import { findPrevNext } from '@/lib/treatments/pager'
import type {
  TreatmentDetail,
  TreatmentSibling,
} from '@/types/treatments'

// Server-rendered on demand: reads auth cookies (Supabase server client),
// which is incompatible with static/ISR rendering and 500s in production.
export const dynamic = 'force-dynamic'

const PRACTITIONER = 'our therapists'

async function loadDetail(
  categorySlug: string,
  treatmentSlug: string,
): Promise<{ treatment: TreatmentDetail | null; siblings: TreatmentSibling[] }> {
  try {
    const supabase = await createClient()
    const treatment = await getTreatmentBySlug(supabase, categorySlug, treatmentSlug)
    if (!treatment) return { treatment: null, siblings: [] }
    const siblings = await getTreatmentSiblings(supabase, treatment.category._id)
    return { treatment, siblings }
  } catch (err) {
    console.error(`[treatments/${categorySlug}/${treatmentSlug}] fetch failed:`, err)
    return { treatment: null, siblings: [] }
  }
}

export async function generateStaticParams(): Promise<
  Array<{ categorySlug: string; treatmentSlug: string }>
> {
  // Rendered on-demand (dynamicParams = true); skip build-time enumeration.
  return []
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; treatmentSlug: string }
}): Promise<Metadata> {
  const { treatment } = await loadDetail(params.categorySlug, params.treatmentSlug)
  if (!treatment) {
    return { title: 'Treatment not found', robots: { index: false, follow: true } }
  }
  const ogImage = treatment.heroImage
    ? urlForImage(treatment.heroImage).width(1200).height(630).fit('crop').url()
    : undefined
  return {
    title: `${treatment.title} — ${treatment.category.title} | Ayurvedic Wellness Centre`,
    description: treatment.description ?? undefined,
    alternates: {
      canonical: `/treatments/${treatment.category.slug}/${treatment.slug}`,
    },
    openGraph: {
      title: `${treatment.title} — Ayurvedic Wellness Centre`,
      description: treatment.description ?? undefined,
      type: 'article',
      url: `https://ayurvedawellness.com.my/treatments/${treatment.category.slug}/${treatment.slug}`,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: { categorySlug: string; treatmentSlug: string }
}) {
  const { treatment, siblings } = await loadDetail(
    params.categorySlug,
    params.treatmentSlug,
  )
  if (!treatment) notFound()

  // A hero-split pair: the gallery contains only 1–2 extra photos (already
  // deduped of the hero in the data layer). Use the first/second as the
  // secondary hero image and skip the separate Gallery section. If there are
  // 3+ images, treat it as an ordinary editorial gallery instead.
  const heroSplitImage =
    treatment.gallery && treatment.gallery.length > 0 && treatment.gallery.length <= 2
      ? (treatment.gallery[1] ?? treatment.gallery[0])
      : null

  const { prev, next } = findPrevNext(siblings, treatment.slug)
  const whatsappMessage = `Hi, I'd like to book a ${treatment.title} session.`
  const whatsappHref = `https://wa.me/601163393436?text=${encodeURIComponent(whatsappMessage)}`

  // Related: siblings excluding current, max 3.
  const related = siblings
    .filter((s) => s.slug !== treatment.slug)
    .slice(0, 3)
    .map((s) => ({
      _id: s._id,
      title: s.title,
      slug: s.slug,
      categorySlug: s.categorySlug,
      duration: s.duration,
      heroImage: s.heroImage,
      categoryTitle: treatment.category.title,
    }))

  // JSON-LD MedicalProcedure
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.title,
    description: treatment.description ?? undefined,
    bodyLocation: undefined,
    procedureType: 'TherapeuticProcedure',
    performer: { '@type': 'Person', name: PRACTITIONER },
    provider: {
      '@type': 'MedicalBusiness',
      name: 'Ayurvedic Wellness Centre',
      url: 'https://ayurvedawellness.com.my',
    },
    url: `https://ayurvedawellness.com.my/treatments/${treatment.category.slug}/${treatment.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TherapyStickyBar treatmentId={treatment._id} treatmentTitle={treatment.title} />
      <TherapySwitcher
        categoryTitle={treatment.category.title}
        siblings={siblings}
        currentSlug={treatment.slug}
      />

      <TherapyHero
        image={treatment.heroImage}
        imageUrl={treatment.heroImageUrl}
        secondaryImageUrl={heroSplitImage?.url ?? null}
        categoryTitle={treatment.category.title}
        treatmentOrder={treatment.category.order}
        treatmentTitle={treatment.title}
      />

      <section className="relative bg-cream pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[220px_minmax(0,720px)_minmax(0,260px)] lg:gap-12 lg:px-12 lg:py-16">

          {/* LEFT — desktop marginalia (hidden <lg) */}
          <div className="hidden lg:block">
            <TherapyMarginalia
              origin={treatment.origin}
              sanskritName={treatment.sanskritName}
              practitioner={PRACTITIONER}
              categoryTitle={treatment.category.title}
              categorySlug={treatment.category.slug}
              variant="desktop"
            />
          </div>

          {/* CENTER — body */}
          <article className="min-w-0">
            {/* breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-dark/50"
            >
              <Link href="/treatments" className="text-accent hover:text-primary">
                Treatments
              </Link>
              <span className="mx-2 text-dark/30">/</span>
              <Link
                href={`/treatments/${treatment.category.slug}`}
                className="text-accent hover:text-primary"
              >
                {treatment.category.title}
              </Link>
              <span className="mx-2 text-dark/30">/</span>
              <span>{treatment.title}</span>
            </nav>

            <div className="mt-5 font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              Therapy · No. {String((treatment.category.order ?? 0) + 1).padStart(2, '0')}
            </div>
            <h1
              className="mt-2 font-heading font-extrabold leading-[1.05] tracking-[-0.025em] text-primary"
              style={{ fontSize: 'clamp(2rem, 5.2vw, 2.6rem)' }}
            >
              {treatment.title}
            </h1>
            {treatment.description && (
              <p className="mt-4 font-body text-[18px] italic leading-[1.55] text-dark/72">
                {treatment.description}
              </p>
            )}

            {/* Mobile-only marginalia (hidden ≥lg where the sidebar takes over) */}
            <div className="mt-8 lg:hidden">
              <TherapyMarginalia
                origin={treatment.origin}
                sanskritName={treatment.sanskritName}
                practitioner={PRACTITIONER}
                categoryTitle={treatment.category.title}
                categorySlug={treatment.category.slug}
                variant="mobile"
              />
            </div>

            {/* I · Overview */}
            {treatment.body && treatment.body.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="I" label="Overview" />
                <div className="prose prose-journal mt-4 max-w-none">
                  <PortableText
                    value={treatment.body}
                    components={portableTextComponents}
                  />
                </div>
              </section>
            )}

            {/* II · Gallery — skipped for a hero-split pair (both photos already shown above) */}
            {!heroSplitImage && treatment.gallery && treatment.gallery.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="II" label="Gallery" />
                <div className="mt-4">
                  <TherapyGallery images={treatment.gallery} />
                </div>
              </section>
            )}

            {/* III · Benefits */}
            {treatment.benefits && treatment.benefits.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="III" label="Benefits" />
                <h3 className="mt-4 font-heading text-[22px] font-extrabold tracking-[-0.02em] text-primary">
                  What this therapy supports
                </h3>
                <div className="mt-4">
                  <TherapyBenefits items={treatment.benefits} />
                </div>
              </section>
            )}

            {/* IV · What to expect */}
            {treatment.procedureSteps && treatment.procedureSteps.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="IV" label="What to expect" />
                <h3 className="mt-4 font-heading text-[22px] font-extrabold tracking-[-0.02em] text-primary">
                  The session, step by step
                </h3>
                <div className="mt-4">
                  <TherapyProcedure steps={treatment.procedureSteps} />
                </div>
              </section>
            )}

            {/* V · Not suitable for */}
            {treatment.contraindications && (
              <section className="mt-12">
                <SectionHead numeral="V" label="Not suitable for" />
                <div className="mt-4">
                  <TherapyContraindications text={treatment.contraindications} />
                </div>
              </section>
            )}

            {/* Mid CTA */}
            <TherapyMidCTA
              treatmentId={treatment._id}
              treatmentTitle={treatment.title}
              whatsappHref={whatsappHref}
            />

            {/* VI · Related */}
            {related.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="VI" label="You may also like" />
                <div className="mt-4">
                  <RelatedTherapies items={related} />
                </div>
              </section>
            )}

            <TherapyPager prev={prev} next={next} />
          </article>

          {/* RIGHT — sticky desktop booking card */}
          <BookingSidebar
            treatmentId={treatment._id}
            treatmentTitle={treatment.title}
            duration={treatment.duration}
            sessionsRecommended={treatment.sessionsRecommended}
            whatsappHref={whatsappHref}
            pricing={{
              price: treatment.price,
              priceLabel: treatment.priceLabel,
              bookingType: treatment.bookingType,
              bookingLeadTimeHours: treatment.bookingLeadTimeHours,
            }}
          />
        </div>
      </section>

      <MobileBookingBar treatmentId={treatment._id} treatmentTitle={treatment.title} />

      <div className="pb-16 lg:pb-0" aria-hidden />
      <FreeConsultationBlock whatsappMessage={whatsappMessage} />
    </>
  )
}

/* ───────────────────────────────────────────────────────────────────
 * Reusable section heading — Roman numeral + label with gold rule.
 * ─────────────────────────────────────────────────────────────────── */
function SectionHead({ numeral, label }: { numeral: string; label: string }) {
  return (
    <div className="flex items-center gap-3 font-heading text-[10.5px] font-bold uppercase tracking-[0.28em] text-accent">
      <span>
        {numeral} · {label}
      </span>
      <span
        className="h-px flex-1"
        style={{
          background: 'linear-gradient(to right, rgba(181, 138, 59,0.5), transparent)',
        }}
        aria-hidden
      />
    </div>
  )
}
