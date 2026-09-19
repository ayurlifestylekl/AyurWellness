import type { Metadata } from 'next'
import AuthCanvas from '@/components/auth/AuthCanvas'
import AgentLoginForm from './AgentLoginForm'

export const metadata: Metadata = {
  title: 'Partner Hub · Brand Partner Sign In',
  description: 'Brand Partner sign-in for Ayurvedic Wellness Centre creators.',
  alternates: { canonical: '/agent/login' },
  robots: { index: false, follow: false },
}

export default function AgentLoginPage({
  searchParams,
}: {
  searchParams: { reset?: string; next?: string }
}) {
  return (
    <AuthCanvas>
      <AgentLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </AuthCanvas>
  )
}
