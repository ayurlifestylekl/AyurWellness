import { requireStaff } from '@/lib/staff/guard'
import CheckoutScreen from '@/components/staff/screens/CheckoutScreen'

export const dynamic = 'force-dynamic'

// Shared with the doctor portal: see components/staff/screens/CheckoutScreen.tsx.
export default async function Page() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return <CheckoutScreen db={db} base="/console" />
}
