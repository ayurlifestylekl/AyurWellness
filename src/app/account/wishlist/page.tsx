import { Heart } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listWishlist } from '@/lib/wishlist/queries'

export const metadata = { title: 'My Wishlist' }

export default async function WishlistPage() {
  const me = await getCurrentUser()
  const supabase = await createClient()
  const items = me ? await listWishlist(supabase, me.authId) : []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-7">
      <header>
        <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          <Heart className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
          Wishlist
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]" style={{ letterSpacing: '-0.025em' }}>
          Saved for{' '}
          <span className="italic font-normal text-[#006B3C]/70" style={{ fontFamily: 'var(--font-playfair)' }}>
            later.
          </span>
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#006B3C]/15 bg-white p-10 text-center">
          <p className="font-body text-[14px] text-[#12372D]/65">No saved items yet.</p>
          <Link href="/products" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-5 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#006B3C]">
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/products/${it.product.sku}`} className="group block overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white">
                {it.product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.product.image_url} alt={it.product.name} className="h-44 w-full object-cover transition-transform group-hover:scale-[1.02]" />
                )}
                <div className="p-4">
                  <p className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
                    {it.product.category ?? 'Product'}
                  </p>
                  <h3 className="mt-1 font-heading text-[15px] font-bold text-[#006B3C]">{it.product.name}</h3>
                  <p className="mt-1 font-heading text-[14px] font-semibold text-[#006B3C]">RM {Number(it.product.price_rm).toFixed(2)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
