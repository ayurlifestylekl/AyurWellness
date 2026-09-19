import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
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
    <AuthCanvas>
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </AuthCanvas>
  )
}
