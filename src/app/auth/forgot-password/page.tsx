import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password',
  alternates: { canonical: '/auth/forgot-password' },
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthCanvas>
      <ForgotPasswordForm />
    </AuthCanvas>
  )
}
