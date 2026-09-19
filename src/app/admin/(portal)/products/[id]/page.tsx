import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProductById } from '@/lib/admin/products/queries'
import ProductForm, { type ProductFormValues } from '../new/ProductForm'
import ImageUploader from './ImageUploader'
import StockSummaryCard from './StockSummaryCard'
import BundleComposition from './BundleComposition'

export const metadata = { title: 'Edit Product · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const product = await getProductById(supabase, params.id)
  if (!product) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = product

  const initial: Partial<ProductFormValues> = {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price_rm: Number(p.price_rm),
    sale_price_rm: p.sale_price_rm != null ? Number(p.sale_price_rm) : null,
    member_price_rm: p.member_price_rm != null ? Number(p.member_price_rm) : null,
    short_description: p.short_description ?? '',
    description: p.description ?? '',
    ingredients: p.ingredients ?? '',
    dosage_instructions: p.dosage_instructions ?? '',
    contraindications: p.contraindications ?? '',
    certifications: p.certifications ?? '',
    dosha_indication: p.dosha_indication ?? 'none',
    category: p.category ?? '',
    tags: p.tags ?? [],
    status: p.status,
    featured: p.featured,
    meta_title: p.meta_title ?? '',
    meta_description: p.meta_description ?? '',
    weight_grams: p.weight_grams,
    expiry_date: p.expiry_date ?? '',
    low_stock_threshold: p.low_stock_threshold,
    allow_backorder: p.allow_backorder,
    is_bundle: p.is_bundle,
    image_url: p.image_url ?? '',
    stock_qty: p.stock_qty,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wholesale_enabled: Boolean((p as any).wholesale_enabled),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wholesale_price_rm: (p as any).wholesale_price_rm != null ? Number((p as any).wholesale_price_rm) : null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundleItems: any[] = Array.isArray(p.bundle_items) ? p.bundle_items : []
  const components = bundleItems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((bi: any) => {
      const child = Array.isArray(bi.child) ? bi.child[0] : bi.child
      if (!child) return null
      return {
        id: bi.id,
        childProductId: bi.child_product_id,
        childName: child.name,
        childSku: child.sku,
        childPriceRm: Number(child.price_rm),
        quantity: bi.quantity,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Pull a candidate-products list for the bundle picker
  const { data: candidateRows } = await supabase
    .from('products')
    .select('id, name, sku, price_rm')
    .eq('status', 'active')
    .neq('id', p.id)
    .order('name')
    .limit(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidates = ((candidateRows ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    price_rm: Number(r.price_rm),
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href="/admin/products"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to products
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">{p.name}</h1>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            {p.sku} · {p.slug ?? 'no-slug'} · updated{' '}
            {new Date(p.updated_at).toLocaleString('en-MY')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductForm mode="edit" initial={initial} />
        </div>

        <aside className="flex flex-col gap-3">
          <StockSummaryCard
            productId={p.id}
            stockQty={p.stock_qty}
            lowStockThreshold={p.low_stock_threshold}
            expiryDate={p.expiry_date}
          />
          <ImageUploader
            productId={p.id}
            initialImageUrls={p.image_urls ?? []}
            initialPrimaryUrl={p.image_url}
          />
          {p.is_bundle ? (
            <BundleComposition
              bundleId={p.id}
              initial={components}
              availableProducts={candidates}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )
}
