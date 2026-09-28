import type { Metadata } from 'next'
import CustomerLoginSplit from '@/components/auth/CustomerLoginSplit'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Password',
  alternates: { canonical: '/auth/reset-password' },
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <CustomerLoginSplit>
      <ResetPasswordForm />
    </CustomerLoginSplit>
  )
}
