import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
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
    <AuthCanvas>
      <AdminLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </AuthCanvas>
  )
}
