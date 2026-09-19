import type { SupabaseClient } from '@supabase/supabase-js'

export interface WholesaleCatalogItem {
  id: string
  name: string
  sku: string | null
  imageUrl: string | null
  category: string | null
  retailPriceRm: number
  wholesalePriceRm: number
  stockQty: number
  allowBackorder: boolean
  shortDescription: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function listWholesaleCatalog(
  supabase: SB,
): Promise<WholesaleCatalogItem[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, sku, image_url, category, price_rm, wholesale_price_rm,
       stock_qty, allow_backorder, short_description`,
    )
    .eq('wholesale_enabled', true)
    .eq('status', 'active')
    .not('wholesale_price_rm', 'is', null)
    .order('name', { ascending: true })

  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku ?? null,
    imageUrl: r.image_url ?? null,
    category: r.category ?? null,
    retailPriceRm: Number(r.price_rm ?? 0),
    wholesalePriceRm: Number(r.wholesale_price_rm ?? 0),
    stockQty: Number(r.stock_qty ?? 0),
    allowBackorder: Boolean(r.allow_backorder),
    shortDescription: r.short_description ?? null,
  }))
}

export async function listWholesaleProductsByIds(
  supabase: SB,
  ids: string[],
): Promise<WholesaleCatalogItem[]> {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('products')
    .select(
      `id, name, sku, image_url, category, price_rm, wholesale_price_rm,
       stock_qty, allow_backorder, short_description`,
    )
    .eq('wholesale_enabled', true)
    .in('id', ids)

  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku ?? null,
    imageUrl: r.image_url ?? null,
    category: r.category ?? null,
    retailPriceRm: Number(r.price_rm ?? 0),
    wholesalePriceRm: Number(r.wholesale_price_rm ?? 0),
    stockQty: Number(r.stock_qty ?? 0),
    allowBackorder: Boolean(r.allow_backorder),
    shortDescription: r.short_description ?? null,
  }))
}
