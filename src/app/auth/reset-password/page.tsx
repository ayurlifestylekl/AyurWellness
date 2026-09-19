import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Password',
  alternates: { canonical: '/auth/reset-password' },
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <AuthCanvas>
      <ResetPasswordForm />
    </AuthCanvas>
  )
}
