import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type WishlistRow = Database['public']['Tables']['wishlist_items']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']

export interface WishlistEntry {
  id: string
  addedAt: string
  product: Pick<ProductRow, 'id' | 'name' | 'price_rm' | 'image_url' | 'category' | 'sku' | 'stock_qty'>
}

export async function listWishlist(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<WishlistEntry[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id, created_at, product:products(id, name, price_rm, image_url, category, sku, stock_qty)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[wishlist/list] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[])
    .filter((row) => row.product)
    .map((row) => ({ id: row.id, addedAt: row.created_at, product: row.product }))
}

export async function getWishlistProductIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('customer_id', customerId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Set((data ?? []).map((r: any) => r.product_id))
}
