import { requireStaff } from '@/lib/staff/guard'
import BillingItemsPage from '@/lib/counter/billing-items-page'

export const dynamic = 'force-dynamic'

export default async function DoctorBillingItems() {
  const { db } = await requireStaff(['admin', 'doctor'])
  return <BillingItemsPage db={db} />
}
