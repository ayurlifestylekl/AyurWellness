import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type ProductRow = Database['public']['Tables']['products']['Row']
type Status = ProductRow['status']

export interface ProductListItem {
  id: string
  name: string
  sku: string
  slug: string | null
  priceRm: number
  salePriceRm: number | null
  stockQty: number
  category: string | null
  status: Status
  featured: boolean
  imageUrl: string | null
  updatedAt: string
}

export interface ProductFilters {
  status?: Status
  category?: string
  featured?: boolean
  search?: string
  limit?: number
  offset?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export async function listProducts(
  supabase: SB,
  filters: ProductFilters = {},
): Promise<{ items: ProductListItem[]; total: number }> {
  let q = supabase
    .from('products')
    .select(
      `id, name, sku, slug, price_rm, sale_price_rm, stock_qty,
       category, status, featured, image_url, updated_at`,
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })

  if (filters.status) q = q.eq('status', filters.status)
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.featured !== undefined) q = q.eq('featured', filters.featured)
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%,slug.ilike.%${s}%`)
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 50
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/products] listProducts failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((r): ProductListItem => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    slug: r.slug,
    priceRm: Number(r.price_rm),
    salePriceRm: r.sale_price_rm != null ? Number(r.sale_price_rm) : null,
    stockQty: r.stock_qty,
    category: r.category,
    status: r.status,
    featured: r.featured,
    imageUrl: r.image_url,
    updatedAt: r.updated_at,
  }))
  return { items, total: count ?? 0 }
}

export async function getProductById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `*, bundle_items:bundle_items!bundle_items_bundle_product_id_fkey(
        id, child_product_id, quantity,
        child:products!bundle_items_child_product_id_fkey(id, name, sku, price_rm, stock_qty, image_url)
      )`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/products] getProductById failed:', error.message)
    return null
  }
  return data
}

export async function listCategoriesInUse(supabase: SB): Promise<string[]> {
  const { data } = await supabase.from('products').select('category').not('category', 'is', null)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = new Set<string>((data as any[]).map((r) => r.category).filter(Boolean))
  return Array.from(set).sort()
}

// ───────────────────────────────────────────────────────────────────────
// Inventory queries
// ───────────────────────────────────────────────────────────────────────

export interface InventoryRow {
  id: string
  name: string
  sku: string
  category: string | null
  stockQty: number
  lowStockThreshold: number | null
  effectiveThreshold: number
  expiryDate: string | null
  imageUrl: string | null
  status: 'healthy' | 'low' | 'out' | 'expiring'
}

const GLOBAL_LOW_STOCK_THRESHOLD = 5
const EXPIRING_SOON_DAYS = 60

export interface InventoryFilters {
  filter?: 'low-stock' | 'out-of-stock' | 'expiring-soon' | 'recently-received' | null
  category?: string
  search?: string
  limit?: number
  offset?: number
}

export async function listInventory(
  supabase: SB,
  filters: InventoryFilters = {},
): Promise<{ items: InventoryRow[]; total: number }> {
  let q = supabase
    .from('products')
    .select(
      `id, name, sku, category, stock_qty, low_stock_threshold, expiry_date, image_url`,
      { count: 'exact' },
    )
    .eq('status', 'active')

  if (filters.filter === 'out-of-stock') q = q.eq('stock_qty', 0)
  if (filters.filter === 'expiring-soon') {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + EXPIRING_SOON_DAYS)
    q = q
      .not('expiry_date', 'is', null)
      .lte('expiry_date', cutoff.toISOString().slice(0, 10))
  }
  if (filters.category) q = q.eq('category', filters.category)
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%`)
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 50
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/inventory] listInventory failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = ((data ?? []) as any[]).map((r): InventoryRow => {
    const threshold = r.low_stock_threshold ?? GLOBAL_LOW_STOCK_THRESHOLD
    let status: InventoryRow['status'] = 'healthy'
    if (r.stock_qty === 0) status = 'out'
    else if (r.stock_qty <= threshold) status = 'low'
    if (r.expiry_date) {
      const days =
        (new Date(r.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      if (days <= EXPIRING_SOON_DAYS && status === 'healthy') status = 'expiring'
    }
    return {
      id: r.id,
      name: r.name,
      sku: r.sku,
      category: r.category,
      stockQty: r.stock_qty,
      lowStockThreshold: r.low_stock_threshold,
      effectiveThreshold: threshold,
      expiryDate: r.expiry_date,
      imageUrl: r.image_url,
      status,
    }
  })

  // 'low-stock' is filtered post-query because the threshold can be per-product
  if (filters.filter === 'low-stock') {
    items = items.filter((i) => i.status === 'low')
  }

  return {
    items,
    total: filters.filter === 'low-stock' ? items.length : count ?? 0,
  }
}

export async function getInventoryProductDetail(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, sku, slug, stock_qty, low_stock_threshold, expiry_date,
       category, image_url, status, allow_backorder`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/inventory] getInventoryProductDetail failed:', error.message)
    return null
  }
  return data
}

export async function listStockMovements(
  supabase: SB,
  productId: string,
  limit = 50,
) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(
      `id, movement_type, quantity_delta, reason, cost_price_rm, expiry_date,
       notes, created_at,
       actor:users!stock_movements_actor_id_fkey(id, full_name)`,
    )
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[admin/inventory] listStockMovements failed:', error.message)
    return []
  }
  return data ?? []
}
