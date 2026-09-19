import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/products/actions'
import { createClient } from '@/lib/supabase/server'
import { productsToCsv, type ProductCsvRow } from '@/lib/admin/products/csv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `name, sku, price_rm, stock_qty, status, category,
       short_description, description, ingredients, dosage_instructions,
       contraindications, certifications, dosha_indication,
       sale_price_rm, member_price_rm, weight_grams, low_stock_threshold,
       expiry_date, tags, meta_title, meta_description, featured,
       allow_backorder, image_url`,
    )
    .order('name')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Partial<ProductCsvRow>[] = ((data ?? []) as any[]).map((r) => ({
    name: r.name,
    sku: r.sku,
    price_rm: Number(r.price_rm),
    stock_qty: r.stock_qty,
    status: r.status,
    category: r.category,
    short_description: r.short_description,
    description: r.description,
    ingredients: r.ingredients,
    dosage_instructions: r.dosage_instructions,
    contraindications: r.contraindications,
    certifications: r.certifications,
    dosha_indication: r.dosha_indication,
    sale_price_rm: r.sale_price_rm != null ? Number(r.sale_price_rm) : undefined,
    member_price_rm: r.member_price_rm != null ? Number(r.member_price_rm) : undefined,
    weight_grams: r.weight_grams,
    low_stock_threshold: r.low_stock_threshold,
    expiry_date: r.expiry_date,
    tags: Array.isArray(r.tags) ? r.tags.join(',') : undefined,
    meta_title: r.meta_title,
    meta_description: r.meta_description,
    featured: r.featured,
    allow_backorder: r.allow_backorder,
    image_url: r.image_url,
  }))

  const csv = productsToCsv(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
