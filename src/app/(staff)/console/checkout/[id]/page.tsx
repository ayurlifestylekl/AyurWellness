import { notFound, redirect } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getBill, listRedeemablePackages, listSellableProducts } from '@/lib/counter/queries'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { toServiceOptions } from '@/lib/staff/services'
import CheckoutCart from '@/components/staff/CheckoutCart'

export const dynamic = 'force-dynamic'

export default async function BillPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const bill = await getBill(db, params.id)
  if (!bill) notFound()
  if (bill.status !== 'open') redirect(`/console/checkout/${bill.id}/receipt`)
  const [treatments, products, packages] = await Promise.all([
    getTreatmentsFlat(db),
    listSellableProducts(db),
    listRedeemablePackages(db, bill.customerPhone),
  ])
  return (
    <CheckoutCart
      bill={bill}
      services={toServiceOptions(treatments)}
      products={products}
      packages={packages}
      patientHref={bill.patientId ? `/console/patients/${bill.patientId}` : null}
    />
  )
}
