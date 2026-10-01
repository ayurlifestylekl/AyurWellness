import type { Metadata } from 'next'
import StaffLoginSplit from '@/components/auth/StaffLoginSplit'
import AgentLoginForm from './AgentLoginForm'
import AccountsClosedNotice from '@/components/auth/AccountsClosedNotice'
import { memberAccountsOpen } from '@/lib/auth/accounts'

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
      {/* One block, because StaffLoginSplit lays its children out in a row.
          Sign-in itself is password-only, so the form stays for any partner who
          already has an account; the note covers everyone else. */}
      <div className="w-full">
        {!memberAccountsOpen() && <AccountsClosedNotice variant="partner" className="mb-6" />}
        <AgentLoginForm
          resetSuccess={searchParams.reset === 'success'}
          nextPath={searchParams.next}
        />
      </div>
    </StaffLoginSplit>
  )
}
