/**
 * Storefront product reads. Single source of truth for /products and
 * /products/[slug] when the Supabase catalogue has rows. Falls back to
 * the hardcoded seed catalog (src/data/products.ts) when DB is empty so
 * the marketing site never goes blank during transition.
 */
import type { Product } from '@/types/content'
import type { SupabaseClient } from '@supabase/supabase-js'
import { products as hardcoded } from '@/data/products'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

function slugifyCategory(c: string | null): string {
  if (!c) return 'uncategorized'
  return c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(r: any): Product {
  const onSale = r.sale_price_rm != null && Number(r.sale_price_rm) > 0
  const dosha = r.dosha_indication && r.dosha_indication !== 'none' ? [r.dosha_indication] : []
  const ingredientsList = r.ingredients
    ? String(r.ingredients).split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean)
    : undefined
  return {
    id: r.slug ?? r.id,
    name: r.name,
    tagline: r.short_description ?? '',
    description: r.description ?? '',
    category: slugifyCategory(r.category),
    priceRm: onSale ? Number(r.sale_price_rm) : Number(r.price_rm),
    oldPriceRm: onSale ? Number(r.price_rm) : undefined,
    badge: onSale ? 'SALE' : r.featured ? 'BESTSELLER' : undefined,
    image:
      r.image_url ??
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    sku: r.sku,
    stockQty: r.stock_qty,
    isBundle: r.is_bundle ?? false,
    createdAt: r.created_at ?? new Date().toISOString(),
    ingredients: ingredientsList,
    dose: r.dosage_instructions ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doshas: dosha as any,
    useCases: Array.isArray(r.tags) ? r.tags : undefined,
  }
}

export async function getStorefrontProducts(supabase: SB): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, name, description, short_description, price_rm, sale_price_rm,
       sku, stock_qty, category, is_bundle, image_url, created_at,
       dosha_indication, ingredients, dosage_instructions, tags, featured, status`,
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[storefront/products] failed:', error.message)
    return hardcoded
  }

  if (!data || data.length === 0) {
    // No real catalog yet — keep the marketing site populated with the seed list
    return hardcoded
  }
  return data.map(rowToProduct)
}

export async function getStorefrontProductBySlug(
  supabase: SB,
  slug: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, name, description, short_description, price_rm, sale_price_rm,
       sku, stock_qty, category, is_bundle, image_url, created_at,
       dosha_indication, ingredients, dosage_instructions, tags, featured, status`,
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('[storefront/productBySlug] failed:', error.message)
  }

  if (data) return rowToProduct(data)

  // Fallback: look in the hardcoded seed catalog by id (legacy "slug" was the id)
  return hardcoded.find((p) => p.id === slug) ?? null
}
