import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { CLINIC_EMAIL, CLINIC_LEGAL_NAME } from '@/lib/clinic'

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How Ayurvedic Wellness Centre collects, uses and protects your personal data under the Personal Data Protection Act 2010.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Privacy notice"
      updated="29 September 2026"
      intro={
        <p>
          {CLINIC_LEGAL_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This notice explains what personal data we
          collect through our website and centre, why we use it, and the choices you have, in line with Malaysia&apos;s Personal Data
          Protection Act 2010 (PDPA).
        </p>
      }
      sections={[
        {
          heading: 'What we collect',
          body: (
            <ul>
              <li><strong>Contact and account details</strong> — your name, email, phone number, password (stored securely, never visible to our staff), gender, date of birth and preferred language.</li>
              <li><strong>Health information</strong> — details you choose to share so our Vaidyas and therapists can treat you safely, such as allergies, medications, medical conditions, height, weight, pregnancy or menstrual status, and your Prakriti (dosha) assessment answers.</li>
              <li><strong>Booking and treatment records</strong> — appointments, treatments received, and notes recorded by our practitioners.</li>
              <li><strong>Orders</strong> — products ordered and your delivery address.</li>
              <li><strong>Payment and refund details</strong> — payments are processed by our payment provider; we do not see or store your full card details. For refunds we may ask for your bank details.</li>
              <li><strong>Messages</strong> — enquiries, contact-form messages and conversations with our team.</li>
              <li><strong>Technical data</strong> — basic cookies needed to keep you signed in, and a referral code if you arrive through one of our Brand Partners&apos; links.</li>
            </ul>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <ul>
              <li>To book, confirm, remind you about and deliver your consultations and treatments, including matching you with a same-gender therapist.</li>
              <li>To plan your care safely and keep an accurate record of your treatment.</li>
              <li>To process payments, refunds, orders and deliveries.</li>
              <li>To reply to your messages and provide customer support.</li>
              <li>To send you offers and wellness updates — only if you have agreed, and you can opt out at any time.</li>
              <li>To keep our website and accounts secure and to meet our legal and accounting obligations.</li>
            </ul>
          ),
        },
        {
          heading: 'Health information',
          body: (
            <p>
              Health details are sensitive personal data. We collect them only with your consent and only to provide safe care. They are
              visible only to our clinical team and the staff who need them to look after you, and are never used for marketing.
            </p>
          ),
        },
        {
          heading: 'Who we share it with',
          body: (
            <>
              <p>We never sell your personal data. We share it only with trusted service providers who help us run the centre, under strict confidentiality:</p>
              <ul>
                <li>our website hosting and database providers;</li>
                <li>our payment provider, to process payments and refunds;</li>
                <li>our email provider, to send booking confirmations and sign-in codes;</li>
                <li>courier companies, to deliver your orders;</li>
                <li>authorities, where the law requires it.</li>
              </ul>
              <p>Some of these providers store data on servers outside Malaysia (for example in Singapore). Where that happens, we take steps to ensure your data remains protected.</p>
            </>
          ),
        },
        {
          heading: 'How long we keep it',
          body: (
            <p>
              We keep your data for as long as your account is active or as needed to provide our services. Treatment and financial records
              may be kept longer where the law requires. When data is no longer needed, we delete or anonymise it.
            </p>
          ),
        },
        {
          heading: 'Your choices and rights',
          body: (
            <>
              <p>Under the PDPA you may access and correct your personal data, and limit how it is used. From your account you can:</p>
              <ul>
                <li>update your details and health information in <Link href="/account/profile" className="font-semibold text-primary underline-offset-4 hover:underline">Profile</Link>;</li>
                <li>turn marketing messages and reminders on or off;</li>
                <li>download a copy of your data;</li>
                <li>request deletion of your account.</li>
              </ul>
              <p>
                You can also contact us at <a href={`mailto:${CLINIC_EMAIL}`} className="font-semibold text-primary underline-offset-4 hover:underline">{CLINIC_EMAIL}</a>. If
                you choose not to provide certain information, we may not be able to book or safely provide some treatments.
              </p>
            </>
          ),
        },
        {
          heading: 'Keeping your data safe',
          body: (
            <p>
              We use secure, encrypted connections, restricted staff access based on job role, and verification codes when you sign in. No
              system is completely secure, so please keep your password private and let us know straight away if you suspect misuse.
            </p>
          ),
        },
        {
          heading: 'Children',
          body: <p>Treatments for children must be booked by a parent or guardian, who provides the child&apos;s details on their behalf.</p>,
        },
        {
          heading: 'Changes to this notice',
          body: <p>We may update this notice from time to time. The latest version will always be on this page, with the date it was last updated.</p>,
        },
      ]}
    />
  )
}
