import { requireStaff } from '@/lib/staff/guard'
import WaitingScreen from '@/components/staff/screens/WaitingScreen'

export const dynamic = 'force-dynamic'

// Shared with the front desk portal: see components/staff/screens/WaitingScreen.tsx.
export default async function Page({ searchParams }: { searchParams: { screen?: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  return <WaitingScreen db={db} base="/doctor" screen={searchParams.screen === '1'} />
}
