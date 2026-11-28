import { requireStaff } from '@/lib/staff/guard'
import BillScreen from '@/components/staff/screens/BillScreen'

export const dynamic = 'force-dynamic'

// Shared with the doctor portal: see components/staff/screens/BillScreen.tsx.
export default async function Page({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return <BillScreen db={db} id={params.id} base="/console" />
}
