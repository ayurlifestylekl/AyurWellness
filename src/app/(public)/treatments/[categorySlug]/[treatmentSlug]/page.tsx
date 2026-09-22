import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import BookingSidebar from '@/components/treatments/BookingSidebar'
import FreeConsultationBlock from '@/components/treatments/FreeConsultationBlock'
import MobileBookingBar from '@/components/treatments/MobileBookingBar'
import RelatedTherapies from '@/components/treatments/RelatedTherapies'
import TherapyBenefits from '@/components/treatments/TherapyBenefits'
import TherapyContraindications from '@/components/treatments/TherapyContraindications'
import TherapyHero from '@/components/treatments/TherapyHero'
import TherapyMarginalia from '@/components/treatments/TherapyMarginalia'
import TherapyMidCTA from '@/components/treatments/TherapyMidCTA'
import TherapyPager from '@/components/treatments/TherapyPager'
import TherapyProcedure from '@/components/treatments/TherapyProcedure'
import TherapyStickyBar from '@/components/treatments/TherapyStickyBar'
import TherapySwitcher from '@/components/treatments/TherapySwitcher'
import {
  findPrevNext,
  getAllCategories,
  getCategoryBySlug,
  getSiblings,
  getTreatmentBySlug,
  getTreatmentsByCategorySlug,
} from '@/data/treatments'
import { CLINIC_DOMAIN, CLINIC_NAME, whatsappLink } from '@/lib/clinic'

// Practitioners administer these therapies in-clinic; consultations are led
// by a Vaidya, but day-to-day sessions are with the therapist team.
const PRACTITIONER = 'our therapists'

export async function generateStaticParams(): Promise<
  Array<{ categorySlug: string; treatmentSlug: string }>
> {
  const params: Array<{ categorySlug: string; treatmentSlug: string }> = []
  for (const category of getAllCategories()) {
    for (const treatment of getTreatmentsByCategorySlug(category.slug)) {
      params.push({ categorySlug: category.slug, treatmentSlug: treatment.slug })
    }
  }
  return params
}

function loadDetail(categorySlug: string, treatmentSlug: string) {
  const category = getCategoryBySlug(categorySlug)
  if (!category) return null
  const treatment = getTreatmentBySlug(categorySlug, treatmentSlug)
  if (!treatment) return null
  return { category, treatment }
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; treatmentSlug: string }
}): Promise<Metadata> {
  const detail = loadDetail(params.categorySlug, params.treatmentSlug)
  if (!detail) {
    return { title: 'Treatment not found', robots: { index: false, follow: true } }
  }
  const { category, treatment } = detail
  return {
    title: `${treatment.title} — ${category.title} | ${CLINIC_NAME}`,
    description: treatment.description,
    alternates: {
      canonical: `/treatments/${category.slug}/${treatment.slug}`,
    },
    openGraph: {
      title: `${treatment.title} — ${CLINIC_NAME}`,
      description: treatment.description,
      type: 'article',
      url: `https://${CLINIC_DOMAIN}/treatments/${category.slug}/${treatment.slug}`,
      images: [treatment.heroImageUrl],
    },
  }
}

export default function TreatmentDetailPage({
  params,
}: {
  params: { categorySlug: string; treatmentSlug: string }
}) {
  const detail = loadDetail(params.categorySlug, params.treatmentSlug)
  if (!detail) notFound()
  const { category, treatment } = detail

  const siblings = getSiblings(category.slug)
  const { prev, next } = findPrevNext(siblings, treatment.slug)
  const whatsappMessage = `Hi, I'd like to know more about the ${treatment.title} treatment.`
  const whatsappHref = whatsappLink(whatsappMessage)

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
      heroImage: null,
      heroImageUrl: s.heroImageUrl ?? null,
      categoryTitle: category.title,
    }))

  // JSON-LD MedicalProcedure
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.title,
    description: treatment.description ?? undefined,
    procedureType: 'TherapeuticProcedure',
    performer: { '@type': 'Person', name: PRACTITIONER },
    provider: {
      '@type': 'MedicalBusiness',
      name: CLINIC_NAME,
      url: `https://${CLINIC_DOMAIN}`,
    },
    url: `https://${CLINIC_DOMAIN}/treatments/${category.slug}/${treatment.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TherapyStickyBar treatmentTitle={treatment.title} />
      <TherapySwitcher
        categoryTitle={category.title}
        siblings={siblings}
        currentSlug={treatment.slug}
      />

      <TherapyHero
        image={null}
        imageUrl={treatment.heroImageUrl}
        categoryTitle={category.title}
        treatmentOrder={category.order}
        treatmentTitle={treatment.title}
      />

      <section className="relative bg-cream pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[220px_minmax(0,720px)_minmax(0,260px)] lg:gap-12 lg:px-12 lg:py-16">

          {/* LEFT — desktop marginalia (hidden <lg) */}
          <div className="hidden lg:block">
            <TherapyMarginalia
              origin={null}
              sanskritName={treatment.sanskritName}
              practitioner={PRACTITIONER}
              categoryTitle={category.title}
              categorySlug={category.slug}
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
                href={`/treatments/${category.slug}`}
                className="text-accent hover:text-primary"
              >
                {category.title}
              </Link>
              <span className="mx-2 text-dark/30">/</span>
              <span>{treatment.title}</span>
            </nav>

            <div className="mt-5 font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
              Therapy · No. {String(treatment.order + 1).padStart(2, '0')}
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
                origin={null}
                sanskritName={treatment.sanskritName}
                practitioner={PRACTITIONER}
                categoryTitle={category.title}
                categorySlug={category.slug}
                variant="mobile"
              />
            </div>

            {/* I · Overview — plain paragraphs (source data has no rich text) */}
            {treatment.body.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="I" label="Overview" />
                <div className="prose prose-journal mt-4 max-w-none">
                  {treatment.body.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}

            {/* II · Benefits */}
            {treatment.benefits.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="II" label="Benefits" />
                <h3 className="mt-4 font-heading text-[22px] font-extrabold tracking-[-0.02em] text-primary">
                  What this therapy supports
                </h3>
                <div className="mt-4">
                  <TherapyBenefits items={treatment.benefits} />
                </div>
              </section>
            )}

            {/* III · What to expect */}
            {treatment.procedureSteps.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="III" label="What to expect" />
                <h3 className="mt-4 font-heading text-[22px] font-extrabold tracking-[-0.02em] text-primary">
                  The session, step by step
                </h3>
                <div className="mt-4">
                  <TherapyProcedure steps={treatment.procedureSteps} />
                </div>
              </section>
            )}

            {/* IV · Not suitable for */}
            {treatment.contraindications && (
              <section className="mt-12">
                <SectionHead numeral="IV" label="Not suitable for" />
                <div className="mt-4">
                  <TherapyContraindications text={treatment.contraindications} />
                </div>
              </section>
            )}

            {/* Mid CTA */}
            <TherapyMidCTA treatmentTitle={treatment.title} whatsappHref={whatsappHref} />

            {/* V · Related */}
            {related.length > 0 && (
              <section className="mt-12">
                <SectionHead numeral="V" label="You may also like" />
                <div className="mt-4">
                  <RelatedTherapies items={related} />
                </div>
              </section>
            )}

            <TherapyPager prev={prev} next={next} />
          </article>

          {/* RIGHT — sticky desktop booking card */}
          <BookingSidebar
            treatmentTitle={treatment.title}
            duration={treatment.duration}
            sessionsRecommended={null}
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

      <MobileBookingBar treatmentTitle={treatment.title} />

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
