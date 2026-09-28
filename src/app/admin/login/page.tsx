import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
import AdminLoginForm from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Command Center · Staff Sign In',
  description: 'Ayurvedic Wellness Centre Command Center — staff access only.',
  alternates: { canonical: '/admin/login' },
  robots: { index: false, follow: false },
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { reset?: string; next?: string }
}) {
  return (
    <StaffLoginSplit
      eyebrow="Command Center"
      headline="Run the centre from one place."
      blurb="Bookings, therapists, refunds and reports — staff access only."
      image="/about/centre-lounge.jpg"
    >
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </StaffLoginSplit>
  )
}
