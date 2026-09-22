import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getStorefrontProducts } from '@/lib/storefront/products'
import CheckoutContents from './CheckoutContents'

export const metadata: Metadata = {
  title: 'Checkout | Kerala Ayurvedic Lifestyle',
  description: 'Complete your order of authentic Kerala Ayurvedic products.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const me = await getCurrentUser()
  const supabase = await createClient()
  const products = await getStorefrontProducts(supabase)

  return (
    <CheckoutContents
      products={products}
      user={
        me
          ? {
              id: me.authId,
              fullName: me.profile.full_name ?? '',
              email: me.email ?? '',
              phone: me.phone ?? '',
              role: me.role,
            }
          : null
      }
    />
  )
}
