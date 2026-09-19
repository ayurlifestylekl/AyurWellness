import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Pass-through. Each /auth/* page chooses its own outer chrome —
 * /auth/login uses the editorial split (CustomerLoginSplit), forgot/reset
 * each wrap in AuthCanvas inline.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
