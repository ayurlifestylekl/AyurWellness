import type { Metadata } from 'next'
import CustomerLoginSplit from '@/components/auth/CustomerLoginSplit'
import ForgotPasswordForm from './ForgotPasswordForm'
import AccountsClosedNotice from '@/components/auth/AccountsClosedNotice'
import { memberAccountsOpen } from '@/lib/auth/accounts'

export const metadata: Metadata = {
  title: 'Forgot Password',
  alternates: { canonical: '/auth/forgot-password' },
  robots: { index: false, follow: false },
}

// Read MEMBER_ACCOUNTS_OPEN per request rather than freezing it at build time.
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <CustomerLoginSplit>
      {memberAccountsOpen() ? <ForgotPasswordForm /> : <AccountsClosedNotice variant="reset" />}
    </CustomerLoginSplit>
  )
}
