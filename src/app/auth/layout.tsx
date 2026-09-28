import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Pass-through. Each /auth/* page chooses its own outer chrome —
 * /auth/login, /auth/register, forgot and reset all use CustomerLoginSplit.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
