import { notFound, redirect } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getBill, getPatientBalances, listRedeemablePackages, listSellableProducts } from '@/lib/counter/queries'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { checkoutProducts, checkoutServices, getCounterCatalog, packagesForSale } from '@/lib/counter/catalog'
import { toServiceOptions } from '@/lib/staff/services'
import CheckoutCart from '@/components/staff/CheckoutCart'

export const dynamic = 'force-dynamic'

export default async function BillPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const bill = await getBill(db, params.id)
  if (!bill) notFound()
  if (bill.status !== 'open') redirect(`/console/checkout/${bill.id}/receipt`)
  const [treatments, products, packages, balances, catalog] = await Promise.all([
    getTreatmentsFlat(db),
    listSellableProducts(db),
    listRedeemablePackages(db, bill.customerPhone),
    bill.patientId ? getPatientBalances(db, bill.patientId) : Promise.resolve(null),
    getCounterCatalog(db),
  ])
  return (
    <CheckoutCart
      bill={bill}
      services={checkoutServices(toServiceOptions(treatments), catalog)}
      products={checkoutProducts(products, catalog)}
      packages={packages}
      packagesForSale={packagesForSale(catalog)}
      manageHref="/console/items"
      patientHref={bill.patientId ? `/console/patients/${bill.patientId}` : null}
      balances={balances ? balances.totals : null}
    />
  )
}
