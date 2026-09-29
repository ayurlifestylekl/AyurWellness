import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { CLINIC_LEGAL_NAME } from '@/lib/clinic'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you book treatments, buy products or use the Ayurvedic Wellness Centre website.',
  alternates: { canonical: '/terms' },
}

const link = 'font-semibold text-primary underline-offset-4 hover:underline'

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Terms of service"
      updated="29 September 2026"
      intro={
        <p>
          These terms apply when you use our website, create an account, book a consultation or treatment, or buy products from{' '}
          {CLINIC_LEGAL_NAME} By doing so, you agree to them.
        </p>
      }
      sections={[
        {
          heading: 'Our services',
          body: (
            <p>
              We provide traditional Ayurvedic consultations, therapies and herbal products. Our services support your wellbeing but are
              not a substitute for emergency care or treatment by a registered medical doctor. If you have a medical emergency, contact
              emergency services or go to the nearest hospital.
            </p>
          ),
        },
        {
          heading: 'Your health information',
          body: (
            <p>
              Please tell us accurately about your health, medications, allergies, pregnancy and any conditions before treatment. Our
              practitioners may adjust, postpone or decline a treatment if it is not safe for you. Some treatments have minimum ages or
              require a consultation first.
            </p>
          ),
        },
        {
          heading: 'Bookings',
          body: (
            <ul>
              <li>Consultations are free and confirmed instantly. Treatments are confirmed once payment is received; unpaid slots are released automatically.</li>
              <li>For your comfort, male therapists treat male guests and female therapists treat female guests.</li>
              <li>Please arrive 15 minutes before your appointment. Late arrival may shorten your session so we stay on time for other guests.</li>
            </ul>
          ),
        },
        {
          heading: 'Cancellations and refunds',
          body: (
            <p>
              Cancellations, rescheduling and refunds follow our{' '}
              <Link href="/cancellation" className={link}>Cancellation &amp; Refund Policy</Link>.
            </p>
          ),
        },
        {
          heading: 'Products and delivery',
          body: (
            <ul>
              <li>Prices are shown in Malaysian Ringgit (RM). Delivery charges are shown at checkout before you pay.</li>
              <li>Orders can be cancelled before they are shipped; approved refunds are returned to your original payment method.</li>
              <li>Our herbal products are traditional preparations. Read each product&apos;s directions and cautions, and ask our Vaidya if you are unsure whether a product suits you.</li>
            </ul>
          ),
        },
        {
          heading: 'Payments',
          body: <p>Online payments are processed securely by our payment provider. We do not store your card details.</p>,
        },
        {
          heading: 'Your account',
          body: (
            <p>
              Keep your sign-in details private — you are responsible for activity on your account. Let us know immediately if you
              suspect unauthorised use. We may suspend accounts that are misused.
            </p>
          ),
        },
        {
          heading: 'Offers and vouchers',
          body: <p>Offers and vouchers are subject to their stated conditions, cannot be exchanged for cash, and may not be combined unless stated.</p>,
        },
        {
          heading: 'Website content',
          body: (
            <p>
              Information on this website is for general wellness education, not personal medical advice. All content, images and
              branding belong to {CLINIC_LEGAL_NAME} and may not be copied without permission.
            </p>
          ),
        },
        {
          heading: 'Liability',
          body: (
            <p>
              We take great care in everything we do. To the extent permitted by law, we are not liable for indirect or consequential
              loss, or for results from information you did not disclose to us. Nothing in these terms limits rights you have under
              Malaysian consumer law.
            </p>
          ),
        },
        {
          heading: 'Your personal data',
          body: (
            <p>
              How we handle your data is explained in our <Link href="/privacy" className={link}>Privacy Notice</Link>.
            </p>
          ),
        },
        {
          heading: 'Governing law and changes',
          body: (
            <p>
              These terms are governed by the laws of Malaysia. We may update them from time to time; the latest version will always be on
              this page.
            </p>
          ),
        },
      ]}
    />
  )
}
