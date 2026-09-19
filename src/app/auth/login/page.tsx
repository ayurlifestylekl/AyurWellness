import type { Metadata } from 'next'
import CustomerLoginSplit from '@/components/auth/CustomerLoginSplit'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In or Create Account',
  description: 'Sign in to Ayurvedic Wellness Centre or create your account to track orders and consultations.',
  alternates: { canonical: '/auth/login' },
  robots: { index: false, follow: false },
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { tab?: string; reset?: string; next?: string }
}) {
  const tab = searchParams.tab === 'signup' ? 'signup' : 'signin'
  return (
    <CustomerLoginSplit>
      <LoginForm
        initialTab={tab}
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </CustomerLoginSplit>
  )
}
