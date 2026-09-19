import { requireStaff } from '@/lib/staff/guard'

export const dynamic = 'force-dynamic'

/**
 * Shared guard for all staff areas. Visual chrome lives in each section's
 * own layout: console/layout.tsx (topbar) and doctor/layout.tsx (sidebar).
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireStaff()
  return <>{children}</>
}
