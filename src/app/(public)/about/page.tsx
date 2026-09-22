import type { Metadata } from 'next'
import AboutHero from '@/components/about/AboutHero'
import FoundersVision from '@/components/about/FoundersVision'
import OurPhilosophy from '@/components/about/OurPhilosophy'
import CentreGallery from '@/components/about/CentreGallery'
import TeamOrgChart from '@/components/about/TeamOrgChart'
import KalsDifference from '@/components/about/KalsDifference'
import WellnessFocus from '@/components/about/WellnessFocus'
import CommitmentCTA from '@/components/about/CommitmentCTA'
import FAQs from '@/components/sections/FAQs'
import { aboutFaqs as aboutFaqsFallback } from '@/data/about'
import { fetchAboutPage } from '@/sanity/fetchAboutPage'
import { CLINIC_EMAIL } from '@/lib/clinic'

// Short window so edits to About copy / FAQs published in Sanity Studio
// show up on the live site within ~30s.
export const revalidate = 30

export const metadata: Metadata = {
  title: 'About Us — Authentic Traditional Ayurveda',
  description:
    'Meet the team behind Ayurvedic Wellness Centre in Brickfields, KL. Led by our Vaidyas — 16+ years clinical experience — with KKM-registered, experienced therapists.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: 'https://ayurvedawellness.com.my/about',
    siteName: 'Ayurvedic Wellness Centre',
    title: 'About Ayurvedic Wellness Centre | Brickfields, KL',
    description:
      'Authentic traditional Ayurveda. Led by our Vaidyas. KKM-registered therapists.',
    images: [
      {
        url: '/hero-tray.png',
        width: 1200,
        height: 630,
        alt: 'Ayurvedic Wellness Centre — authentic traditional Ayurveda in Brickfields, KL',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Ayurvedic Wellness Centre | Brickfields, KL',
    description:
      'Authentic traditional Ayurveda. Led by our Vaidyas — 16+ years.',
    images: ['/hero-tray.png'],
  },
}

const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: 'https://ayurvedawellness.com.my/about',
  name: 'About Ayurvedic Wellness Centre',
  description:
    'The story, philosophy and team behind Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Ayurvedic Wellness Centre',
    url: 'https://ayurvedawellness.com.my',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Brickfields',
      addressRegion: 'Kuala Lumpur',
      addressCountry: 'MY',
    },
    telephone: '+6011-6339 3436',
    email: CLINIC_EMAIL,
  },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'our Vaidyas',
  honorificPrefix: 'Vaidya',
  honorificSuffix: 'B.A.M.S., M.D. (Ayu)',
  jobTitle: 'Ayurvedic Physician',
  description:
    'B.A.M.S. and M.D. (Ayurveda) qualified physician with over 16 years of clinical experience. Lead Vaidya at Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur — recognised under Malaysia’s Ministry of Health (KKM) as a Traditional & Complementary Medicine (T&CM) Ayurveda Practitioner.',
  worksFor: {
    '@type': 'MedicalBusiness',
    name: 'Ayurvedic Wellness Centre',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Brickfields',
      addressRegion: 'Kuala Lumpur',
      addressCountry: 'MY',
    },
  },
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'National Council of Indian System of Medicine',
  },
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: 'B.A.M.S — Bachelor of Ayurvedic Medicine and Surgery',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: 'M.D. (Ayurveda)',
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: 'Traditional & Complementary Medicine (T&CM) Ayurveda Practitioner',
      recognizedBy: {
        '@type': 'Organization',
        name: 'Kementerian Kesihatan Malaysia (KKM)',
      },
    },
  ],
}

export default async function AboutPage() {
  // About FAQs are sourced from the local fallback until Sanity is republished
  // with the new brand's copy.
  const about = await fetchAboutPage()
  const aboutFaqs = aboutFaqsFallback

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutHero
        eyebrow={about?.heroEyebrow}
        headlineLead={about?.heroHeadlineLead}
        headlineAccent={about?.heroHeadlineAccent}
        subheading={about?.heroSubheading}
        stats={about?.heroStats}
      />
      {/*
        Founder copy is intentionally driven by the component's defaults until
        the Sanity About singleton is republished with the new brand's copy.
        Restore the prop bindings below once the CMS document is updated.
      */}
      <FoundersVision />
      {/* Gold hairline: cream → white transition */}
      <div
        className="h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(181, 138, 59,0.2), transparent)' }}
        aria-hidden
      />
      <OurPhilosophy />
      <CentreGallery />
      <TeamOrgChart />
      <KalsDifference />
      <WellnessFocus />
      {/* Gold hairline: dark atelier \u2192 cream FAQ transition */}
      <div
        className="h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(181, 138, 59,0.3), transparent)' }}
        aria-hidden
      />
      <FAQs
        items={aboutFaqs}
        eyebrow="Common Questions"
        title="What Visitors Often Ask About Us"
        subtitle="A few things to know before your first visit to Ayurvedic Wellness Centre."
        id="about-faqs"
      />
      <CommitmentCTA
        eyebrow={about?.commitmentEyebrow}
        // headlineLead/headlineAccent driven by component defaults until
        // Sanity is republished ("Your Partner in Health.")
        body={about?.commitmentBody}
        closingLine={about?.commitmentClosingLine}
        primaryLabel={about?.commitmentPrimaryLabel}
        primaryHref={about?.commitmentPrimaryHref}
        secondaryLabel={about?.commitmentSecondaryLabel}
        secondaryHref={about?.commitmentSecondaryHref}
        // trustPills driven by component defaults until Sanity is republished
        // (CMS still has the old "Vaidya AKHIL HS (B.A.M.S)" credential chip).
      />
    </>
  )
}
