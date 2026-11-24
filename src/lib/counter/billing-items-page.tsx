import 'server-only'
import type { ServiceDb } from '@/lib/staff/guard'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { getCounterCatalog } from './catalog'
import BillingItemsManager from '@/components/staff/BillingItemsManager'

/** The Billing items page, shared by the front desk (/console/items) and doctor (/doctor/items) portals. */
export default async function BillingItemsPage({ db }: { db: ServiceDb }) {
  const [catalog, treatments, products] = await Promise.all([
    getCounterCatalog(db),
    getTreatmentsFlat(db),
    db.from('products').select('id, name, price_rm, sale_price_rm, category').eq('status', 'active').order('name'),
  ])
  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Billing items</h1>
      <p className="mt-1 max-w-2xl font-body text-[13.5px] text-dark/60">
        What checkout offers under Services, Products and Packages. Add the centre’s own items, hide what you don’t offer, and remove mistakes.
      </p>
      <div className="mt-5">
        <BillingItemsManager
          ready={catalog.ready}
          items={catalog.items}
          websiteServices={treatments.map((t) => ({ id: t._id, name: t.title, priceRm: t.price ?? null, group: t.categoryTitle ?? '', hidden: catalog.hidden.has(`treatment:${t._id}`) }))}
          shopProducts={(products.data ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            priceRm: p.sale_price_rm != null && Number(p.sale_price_rm) > 0 ? Number(p.sale_price_rm) : Number(p.price_rm),
            group: p.category ?? '',
            hidden: catalog.hidden.has(`product:${p.id}`),
          }))}
        />
      </div>
    </div>
  )
}
