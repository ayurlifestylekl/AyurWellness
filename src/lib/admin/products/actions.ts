'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { slugify, uniqueSlug } from './slug'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

export async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const StatusSchema = z.enum(['active', 'draft', 'archived'])
const DoshaSchema = z.enum(['vata', 'pitta', 'kapha', 'tridosha', 'none'])

const ProductInputSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  price_rm: z.number().nonnegative(),
  sale_price_rm: z.number().nonnegative().nullable().optional(),
  member_price_rm: z.number().nonnegative().nullable().optional(),
  short_description: z.string().max(500).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  ingredients: z.string().optional().or(z.literal('')),
  dosage_instructions: z.string().optional().or(z.literal('')),
  contraindications: z.string().optional().or(z.literal('')),
  certifications: z.string().optional().or(z.literal('')),
  dosha_indication: DoshaSchema.optional(),
  category: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: StatusSchema.default('active'),
  featured: z.boolean().default(false),
  meta_title: z.string().optional().or(z.literal('')),
  meta_description: z.string().optional().or(z.literal('')),
  weight_grams: z.number().int().nonnegative().nullable().optional(),
  expiry_date: z.string().nullable().optional().or(z.literal('')),
  low_stock_threshold: z.number().int().nonnegative().nullable().optional(),
  allow_backorder: z.boolean().default(false),
  is_bundle: z.boolean().default(false),
  image_url: z.string().nullable().optional().or(z.literal('')),
  image_urls: z.array(z.string()).optional(),
  stock_qty: z.number().int().nonnegative().default(0),
  wholesale_enabled: z.boolean().default(false),
  wholesale_price_rm: z.number().nonnegative().nullable().optional(),
})

// Strip empty strings so they become null in DB rather than empty values.
function clean<T extends Record<string, unknown>>(input: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {}
  for (const [k, v] of Object.entries(input)) {
    out[k] = v === '' ? null : v
  }
  return out
}

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------

export async function createProduct(
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const me = await requireAdminSession()
    const input = ProductInputSchema.parse(raw)
    const supabase = await createClient()

    const base = slugify(input.name)
    const slug = await uniqueSlug(base, async (cand) => {
      const { data } = await supabase
        .from('products')
        .select('id')
        .eq('slug', cand)
        .maybeSingle()
      return !!data
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('products') as any)
      .insert({
        ...clean(input),
        slug,
        created_by_admin_id: me.authId,
      })
      .select('id, slug')
      .single()
    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Insert failed.' }
    }

    revalidatePath('/admin/products')
    revalidatePath('/products')
    return { ok: true, data: { id: data.id, slug: data.slug } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

export async function updateProduct(
  productId: string,
  raw: unknown,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const input = ProductInputSchema.partial().parse(raw)
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any)
      .update(clean(input))
      .eq('id', productId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/admin/products')
    revalidatePath('/products')
    return { ok: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

export async function setProductStatus(
  productId: string,
  status: 'active' | 'draft' | 'archived',
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any)
      .update({ status })
      .eq('id', productId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/products')
    revalidatePath('/products')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function setProductFeatured(
  productId: string,
  featured: boolean,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any)
      .update({ featured })
      .eq('id', productId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/products')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function bulkArchive(
  productIds: string[],
): Promise<ActionResult<{ updated: number }>> {
  await requireAdminSession()
  let updated = 0
  for (const id of productIds) {
    const r = await setProductStatus(id, 'archived')
    if (r.ok) updated++
  }
  return { ok: true, data: { updated } }
}

// ---------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------

export async function receiveStock(input: {
  productId: string
  quantity: number
  costPriceRm?: number
  expiryDate?: string
  notes?: string
}): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (input.quantity <= 0) return { ok: false, error: 'Quantity must be > 0.' }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('stock_movements') as any).insert({
      product_id: input.productId,
      movement_type: 'received',
      quantity_delta: input.quantity,
      cost_price_rm: input.costPriceRm ?? null,
      expiry_date: input.expiryDate || null,
      notes: input.notes || null,
      actor_id: me.authId,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/inventory/${input.productId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function writeOffStock(input: {
  productId: string
  quantity: number
  reason: string
}): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (input.quantity <= 0) return { ok: false, error: 'Quantity must be > 0.' }
    if (!input.reason || input.reason.trim().length < 3) {
      return { ok: false, error: 'Reason required (at least 3 characters).' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('stock_movements') as any).insert({
      product_id: input.productId,
      movement_type: 'write_off',
      quantity_delta: -input.quantity,
      reason: input.reason,
      actor_id: me.authId,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/inventory/${input.productId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function recountStock(input: {
  productId: string
  newPhysicalCount: number
  reason: string
}): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (input.newPhysicalCount < 0) {
      return { ok: false, error: 'Count cannot be negative.' }
    }
    const supabase = await createClient()
    const { data: p } = await supabase
      .from('products')
      .select('stock_qty')
      .eq('id', input.productId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (p as any)?.stock_qty ?? 0
    const delta = input.newPhysicalCount - current
    if (delta === 0) return { ok: true }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('stock_movements') as any).insert({
      product_id: input.productId,
      movement_type: 'recount_adjust',
      quantity_delta: delta,
      reason: input.reason || 'Physical recount adjustment',
      actor_id: me.authId,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/inventory/${input.productId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Bundle composition (uses existing public.bundle_items table)
// ---------------------------------------------------------------------------

export async function addBundleItem(input: {
  bundleId: string
  componentProductId: string
  quantity: number
}): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (input.bundleId === input.componentProductId) {
      return { ok: false, error: 'A bundle cannot contain itself.' }
    }
    if (input.quantity <= 0) return { ok: false, error: 'Quantity must be > 0.' }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('bundle_items') as any).insert({
      bundle_product_id: input.bundleId,
      child_product_id: input.componentProductId,
      quantity: input.quantity,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/products/${input.bundleId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function removeBundleItem(input: {
  bundleId: string
  itemId: string
}): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { error } = await supabase
      .from('bundle_items')
      .delete()
      .eq('id', input.itemId)
      .eq('bundle_product_id', input.bundleId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/products/${input.bundleId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Image upload (multipart-friendly: accepts already-buffered file bytes)
// ---------------------------------------------------------------------------

export async function uploadProductImage(input: {
  productId: string
  fileName: string
  fileBytes: ArrayBuffer
  contentType: string
}): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const safe = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${input.productId}/${Date.now()}-${safe}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, input.fileBytes, {
        contentType: input.contentType,
        upsert: false,
      })
    if (error) return { ok: false, error: error.message }

    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
    const publicUrl = pub.publicUrl

    const { data: prod } = await supabase
      .from('products')
      .select('image_urls, image_url')
      .eq('id', input.productId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: string[] = ((prod as any)?.image_urls as string[]) ?? []
    const next = [...existing, publicUrl]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { image_urls: next }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(prod as any)?.image_url) updates.image_url = publicUrl
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('products') as any).update(updates).eq('id', input.productId)

    revalidatePath(`/admin/products/${input.productId}`)
    return { ok: true, data: { url: publicUrl } }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function deleteProductImage(input: {
  productId: string
  imageUrl: string
}): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // strip the public URL prefix to get the storage path
    const marker = '/object/public/product-images/'
    const idx = input.imageUrl.indexOf(marker)
    if (idx >= 0) {
      const path = input.imageUrl.slice(idx + marker.length)
      await supabase.storage.from('product-images').remove([path])
    }
    const { data: prod } = await supabase
      .from('products')
      .select('image_urls, image_url')
      .eq('id', input.productId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: string[] = ((prod as any)?.image_urls as string[]) ?? []
    const next = list.filter((u) => u !== input.imageUrl)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { image_urls: next }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((prod as any)?.image_url === input.imageUrl) {
      updates.image_url = next[0] ?? null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any)
      .update(updates)
      .eq('id', input.productId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/products/${input.productId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

import { parseProductsCsv, type ProductCsvRow } from './csv'

export async function importProductsFromCsvText(
  csvText: string,
): Promise<ActionResult<{ imported: number; failed: number; errors: string[] }>> {
  try {
    const me = await requireAdminSession()
    const supabase = await createClient()
    const { rows, errors } = parseProductsCsv(csvText)
    const errMsgs: string[] = errors.map((e) => `Line ${e.line}: ${e.message}`)
    let imported = 0
    for (const r of rows) {
      const base = slugify(r.name)
      // eslint-disable-next-line no-await-in-loop
      const slug = await uniqueSlug(base, async (cand) => {
        const { data } = await supabase
          .from('products')
          .select('id')
          .eq('slug', cand)
          .maybeSingle()
        return !!data
      })
      const row = csvRowToInsert(r, slug, me.authId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-await-in-loop
      const { error } = await (supabase.from('products') as any).insert(row)
      if (error) errMsgs.push(`Row for SKU ${r.sku}: ${error.message}`)
      else imported++
    }
    revalidatePath('/admin/products')
    revalidatePath('/products')
    return {
      ok: true,
      data: { imported, failed: rows.length - imported, errors: errMsgs },
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

function csvRowToInsert(
  r: ProductCsvRow,
  slug: string,
  adminId: string,
): Record<string, unknown> {
  return {
    name: r.name,
    sku: r.sku,
    slug,
    price_rm: r.price_rm,
    stock_qty: r.stock_qty,
    status: r.status,
    category: r.category ?? null,
    short_description: r.short_description ?? null,
    description: r.description ?? null,
    ingredients: r.ingredients ?? null,
    dosage_instructions: r.dosage_instructions ?? null,
    contraindications: r.contraindications ?? null,
    certifications: r.certifications ?? null,
    dosha_indication: r.dosha_indication ?? 'none',
    sale_price_rm: r.sale_price_rm ?? null,
    member_price_rm: r.member_price_rm ?? null,
    weight_grams: r.weight_grams ?? null,
    low_stock_threshold: r.low_stock_threshold ?? null,
    expiry_date: r.expiry_date ?? null,
    tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
    meta_title: r.meta_title ?? null,
    meta_description: r.meta_description ?? null,
    featured: r.featured ?? false,
    allow_backorder: r.allow_backorder ?? false,
    image_url: r.image_url ?? null,
    created_by_admin_id: adminId,
  }
}
