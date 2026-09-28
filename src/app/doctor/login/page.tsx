import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
import AdminLoginForm from '@/app/admin/login/AdminLoginForm'

export const metadata: Metadata = {
  title: 'Vaidya · Doctor Sign In',
  description: 'Ayurvedic Wellness Centre — practitioner dashboard access.',
  alternates: { canonical: '/doctor/login' },
  robots: { index: false, follow: false },
}

export default function DoctorLoginPage({
  searchParams,
}: {
  searchParams: { reset?: string; next?: string }
}) {
  return (
    <StaffLoginSplit
      eyebrow="Vaidya Portal"
      headline="Your consultations, in one calm view."
      blurb="Today’s patients, case notes and prescriptions."
      image="/about/gallery-treatment-room.jpg"
    >
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </StaffLoginSplit>
  )
}
