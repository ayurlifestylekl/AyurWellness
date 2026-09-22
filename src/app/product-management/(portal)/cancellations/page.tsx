import { listPendingCancellations, listInFlightProductRefunds } from '@/lib/product-management/queries'
import { reconcilePendingRefundsSafe, productRefundDependencies } from '@/lib/payments/refund'
import CancellationsClient from './CancellationsClient'

export const metadata = { title: 'Cancellations & Refunds · Product Management' }
export const dynamic = 'force-dynamic'

export default async function ProductManagementCancellationsPage() {
  // Resolve any refund HitPay reported as still 'pending' before rendering,
  // so this page reflects reality without waiting for the reconciliation cron.
  await reconcilePendingRefundsSafe(productRefundDependencies())
  const [requests, inFlightRefunds] = await Promise.all([
    listPendingCancellations(),
    listInFlightProductRefunds(),
  ])
  return <CancellationsClient requests={requests} inFlightRefunds={inFlightRefunds} />
}
