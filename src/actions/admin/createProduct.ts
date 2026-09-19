'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true; id: string } | { ok: false; error: string }

export async function createProduct(input: {
  name: string
  sku: string
  priceRm: number
  stockQty: number
  category: string
  description?: string
}): Promise<Result> {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') return { ok: false, error: 'Not authorised.' }

  const name = input.name.trim()
  const sku = input.sku.trim().toUpperCase()
  if (!name || name.length > 200) return { ok: false, error: 'Name required (≤200 chars).' }
  if (!sku || !/^[A-Z0-9-]{2,30}$/.test(sku)) {
    return { ok: false, error: 'SKU must be 2-30 chars, A-Z 0-9 or -' }
  }
  if (!Number.isFinite(input.priceRm) || input.priceRm < 0) {
    return { ok: false, error: 'Price must be ≥ 0.' }
  }
  if (!Number.isInteger(input.stockQty) || input.stockQty < 0) {
    return { ok: false, error: 'Stock must be a non-negative integer.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('products') as any)
    .insert({
      name,
      sku,
      price_rm: input.priceRm,
      stock_qty: input.stockQty,
      category: input.category.trim() || null,
      description: input.description?.trim() || null,
      is_bundle: false,
    })
    .select('id')
    .single()

  if (error || !data) {
    const msg = error?.message ?? ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { ok: false, error: 'SKU already exists.' }
    }
    console.error('[createProduct] failed:', msg)
    return { ok: false, error: 'Could not create product.' }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/products')
  return { ok: true, id: (data as { id: string }).id }
}
