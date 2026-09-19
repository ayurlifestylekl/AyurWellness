import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
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
    <AuthCanvas>
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </AuthCanvas>
  )
}
