import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
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
    <StaffLoginSplit
      eyebrow="Partner Hub"
      headline="Share what heals. Grow together."
      blurb="Referrals, commissions and payouts for our Brand Partners."
      image="/hero-shirodhara.jpg"
    >
      <AgentLoginForm
        resetSuccess={searchParams.reset === 'success'}
        nextPath={searchParams.next}
      />
    </StaffLoginSplit>
  )
}
