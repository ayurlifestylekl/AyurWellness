import { requireStaff } from '@/lib/staff/guard'
import BillScreen from '@/components/staff/screens/BillScreen'

export const dynamic = 'force-dynamic'

// Shared with the front desk portal: see components/staff/screens/BillScreen.tsx.
export default async function Page({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  return <BillScreen db={db} id={params.id} base="/doctor" />
}
