import HeroSection from '@/components/HeroSection'
import TrustStrip from '@/components/sections/TrustStrip'
import EmpathyBridge from '@/components/sections/EmpathyBridge'
import ClinicTherapies from '@/components/sections/ClinicTherapies'
import PromoBanners from '@/components/sections/PromoBanners'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import FAQs from '@/components/sections/FAQs'
import FinalBookingCTA from '@/components/sections/FinalBookingCTA'
import { COMMERCE_ENABLED } from '@/lib/admin/features'
import { CLINIC_DOMAIN, CLINIC_EMAIL, CLINIC_LEGAL_NAME, CLINIC_NAME, CLINIC_PHONE_PRIMARY, CLINIC_SOCIALS } from '@/lib/clinic'
import { faqs as homeFaqsFallback } from '@/data/faqs'
import { fetchFaqs } from '@/sanity/fetchFaqs'

// Short window so FAQ edits published in Sanity Studio show up within ~30s.
export const revalidate = 30

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
  name: CLINIC_NAME,
  legalName: CLINIC_LEGAL_NAME,
  description:
    'Authentic traditional Ayurveda centre and apothecary in Brickfields, Kuala Lumpur.',
  url: `https://${CLINIC_DOMAIN}`,
  telephone: CLINIC_PHONE_PRIMARY,
  email: CLINIC_EMAIL,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Brickfields',
    addressRegion: 'Kuala Lumpur',
    addressCountry: 'MY',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Malaysia',
  },
  paymentAccepted: 'Cash, Credit Card, Online Banking',
  // Confirmed by the clinic. These tell Google the official accounts belong to
  // this business, so they can surface in the brand's knowledge panel.
  sameAs: CLINIC_SOCIALS.map((s) => s.url),
}

export default async function Home() {
  const homeFaqs = await fetchFaqs('home', homeFaqsFallback)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HeroSection />
      <TrustStrip />
      <EmpathyBridge />
      <ClinicTherapies />
      <FeaturedProducts />
      {COMMERCE_ENABLED && <PromoBanners />}
      <FAQs items={homeFaqs} />
      <FinalBookingCTA />
    </>
  )
}
