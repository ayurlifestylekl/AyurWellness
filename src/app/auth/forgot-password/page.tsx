import type { Metadata } from 'next'
import CustomerLoginSplit from '@/components/auth/CustomerLoginSplit'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password',
  alternates: { canonical: '/auth/forgot-password' },
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <CustomerLoginSplit>
      <ForgotPasswordForm />
    </CustomerLoginSplit>
  )
}
