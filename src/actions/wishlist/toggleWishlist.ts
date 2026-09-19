'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true; saved: boolean } | { ok: false; error: string }

export async function toggleWishlist(productId: string): Promise<Result> {
  if (!productId) return { ok: false, error: 'Missing product ID.' }
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Sign in to save items.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('customer_id', me.authId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', (existing as { id: string }).id)
    if (error) return { ok: false, error: 'Could not remove from wishlist.' }
    revalidatePath('/account/wishlist')
    return { ok: true, saved: false }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('wishlist_items') as any).insert({
    customer_id: me.authId,
    product_id: productId,
  })
  if (error) return { ok: false, error: 'Could not save to wishlist.' }
  revalidatePath('/account/wishlist')
  return { ok: true, saved: true }
}
