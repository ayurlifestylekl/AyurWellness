import { requireStaff } from '@/lib/staff/guard'
import BillingItemsPage from '@/lib/counter/billing-items-page'

export const dynamic = 'force-dynamic'

export default async function ConsoleBillingItems() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return <BillingItemsPage db={db} />
}
