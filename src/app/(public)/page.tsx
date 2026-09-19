import HeroSection from '@/components/HeroSection'
import TrustStrip from '@/components/sections/TrustStrip'
import EmpathyBridge from '@/components/sections/EmpathyBridge'
import ClinicTherapies from '@/components/sections/ClinicTherapies'
import PromoBanners from '@/components/sections/PromoBanners'
import FeaturedProducts from '@/components/sections/FeaturedProducts'
import Reviews from '@/components/sections/Reviews'
import FAQs from '@/components/sections/FAQs'
import FinalBookingCTA from '@/components/sections/FinalBookingCTA'
import { COMMERCE_ENABLED } from '@/lib/admin/features'
import { CLINIC_DOMAIN, CLINIC_EMAIL, CLINIC_NAME, CLINIC_PHONE_PRIMARY } from '@/lib/clinic'
import { faqs as homeFaqsFallback } from '@/data/faqs'
import { fetchFaqs } from '@/sanity/fetchFaqs'

// Short window so FAQ edits published in Sanity Studio show up within ~30s.
export const revalidate = 30

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
  name: CLINIC_NAME,
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
  // No confirmed social profiles for this brand yet — omitted rather than
  // guessed, since an invented sameAs URL is worse than no URL at all.
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
      {/* Product showcase — pre-launch teaser (Notify Me, no cart/checkout yet).
          Shown regardless of COMMERCE_ENABLED since it's just browsing.
          PromoBanners ("Free Shipping Over RM150") stays off until real
          checkout/shipping is wired up — that offer isn't live yet. */}
      <FeaturedProducts />
      {COMMERCE_ENABLED && <PromoBanners />}
      <Reviews />
      <FAQs items={homeFaqs} />
      <FinalBookingCTA />
    </>
  )
}
