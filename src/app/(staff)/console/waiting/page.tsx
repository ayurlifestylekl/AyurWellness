import { requireStaff } from '@/lib/staff/guard'
import WaitingScreen from '@/components/staff/screens/WaitingScreen'

export const dynamic = 'force-dynamic'

// Shared with the doctor portal: see components/staff/screens/WaitingScreen.tsx.
export default async function Page({ searchParams }: { searchParams: { screen?: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return <WaitingScreen db={db} base="/console" screen={searchParams.screen === '1'} />
}
