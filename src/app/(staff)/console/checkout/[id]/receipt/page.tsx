import { requireStaff } from '@/lib/staff/guard'
import ReceiptScreen from '@/components/staff/screens/ReceiptScreen'

export const dynamic = 'force-dynamic'

// Shared with the doctor portal: see components/staff/screens/ReceiptScreen.tsx.
export default async function Page({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return <ReceiptScreen db={db} id={params.id} base="/console" />
}
