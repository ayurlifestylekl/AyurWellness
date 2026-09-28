import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
import AdminLoginForm from '@/app/admin/login/AdminLoginForm'

export const metadata: Metadata = {
  title: 'Front Desk · Staff Sign In',
  description: 'Ayurvedic Wellness Centre — front desk & admin console access.',
  alternates: { canonical: '/staff/login' },
  robots: { index: false, follow: false },
}

export default function StaffLoginPage({
  searchParams,
}: {
  searchParams: { reset?: string; next?: string }
}) {
  return (
    <StaffLoginSplit
      eyebrow="Front Desk"
      headline="Welcome guests. Keep the day flowing."
      blurb="Check-ins, therapist assignment and today’s schedule."
      image="/about/gallery-frontdesk.jpg"
    >
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </StaffLoginSplit>
  )
}
