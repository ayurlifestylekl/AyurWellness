import { notFound, redirect } from 'next/navigation'
import type { ServiceDb } from '@/lib/staff/guard'
import type { StaffBase } from '@/lib/staff/use-staff-base'
import { getBill, getPatientBalances, listRedeemablePackages, listSellableProducts } from '@/lib/counter/queries'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { checkoutProducts, checkoutServices, getCounterCatalog, packagesForSale, quickAdds } from '@/lib/counter/catalog'
import { toServiceOptions } from '@/lib/staff/services'
import CheckoutCart from '@/components/staff/CheckoutCart'
import { listCaseSheets } from '@/lib/staff/patient-files'
import { matchMedicine } from '@/lib/counter/prescription'
import type { PrescriptionRow } from '@/lib/staff/case-sheets'

/** A bill being made: shared by the front desk (/console) and doctor (/doctor) portals. */
export default async function BillScreen({ db, id, base }: { db: ServiceDb; id: string; base: StaffBase }) {
  const bill = await getBill(db, id)
  if (!bill) notFound()
  if (bill.status !== 'open') redirect(`${base}/checkout/${bill.id}/receipt`)
  const [treatments, products, packages, balances, catalog, sheets] = await Promise.all([
    getTreatmentsFlat(db),
    listSellableProducts(db),
    listRedeemablePackages(db, bill.customerPhone),
    bill.patientId ? getPatientBalances(db, bill.patientId) : Promise.resolve(null),
    getCounterCatalog(db),
    bill.patientId ? listCaseSheets(db, bill.patientId) : Promise.resolve([]),
  ])
  // The newest case sheet with a prescription, matched to what the centre sells.
  const sellable = checkoutProducts(products, catalog)
  const latest = sheets.find((s) => ((s.data.prescriptions as PrescriptionRow[] | undefined) ?? []).some((r) => r.medicine.trim()))
  const prescription = latest
    ? {
        sheetDate: latest.sheetDate,
        doctor: latest.updatedByName,
        lines: ((latest.data.prescriptions as PrescriptionRow[]) ?? [])
          .filter((r) => r.medicine.trim())
          .map((r) => {
            const p = matchMedicine(r.medicine, sellable)
            return {
              medicine: r.medicine.trim(),
              dose: r.dose.trim(),
              duration: r.duration.trim(),
              productId: p?.id ?? null,
              productName: p?.name ?? null,
              onBill: !!p && bill.items.some((i) => (i.productId ?? (i.counterItemId ? `item:${i.counterItemId}` : null)) === p.id),
            }
          }),
      }
    : null
  return (
    <CheckoutCart
      bill={bill}
      services={checkoutServices(toServiceOptions(treatments), catalog)}
      products={sellable}
      prescription={prescription}
      packages={packages}
      packagesForSale={packagesForSale(catalog)}
      quickAdds={quickAdds(catalog)}
      manageHref={`${base}/items`}
      patientHref={bill.patientId ? `${base}/patients/${bill.patientId}` : null}
      balances={balances ? balances.totals : null}
    />
  )
}
