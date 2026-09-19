import Link from 'next/link'
import { Info } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listWholesaleCatalog } from '@/lib/agent/wholesale-shop/queries'
import { getAgentProfileFull } from '@/lib/agent/profile/queries'
import { WholesaleCartProvider } from '@/components/agent/WholesaleCartProvider'
import WholesaleShopClient from './WholesaleShopClient'

export const metadata = { title: 'Wholesale Shop' }
export const dynamic = 'force-dynamic'

export default async function AgentWholesaleShopPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const profile = await getAgentProfileFull(supabase, me.profile.id)

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="font-heading text-2xl font-bold text-[#12372D]">
            Partner profile not found.
          </h1>
          <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
            Your account isn&apos;t linked to a sales agent profile yet.
          </p>
        </div>
      </div>
    )
  }

  if (!profile.canWholesale) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-[#12372D]/15 bg-white p-8">
          <h1 className="font-heading text-2xl font-bold text-[#12372D]">
            Wholesale not enabled
          </h1>
          <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
            Your partner account isn&apos;t enabled for wholesale orders. Contact
            admin if you&apos;d like to start buying stock at wholesale prices.
          </p>
        </div>
      </div>
    )
  }

  const catalog = await listWholesaleCatalog(supabase)

  const shippingReady =
    !!profile.shippingAddress && !!profile.shippingPostcode && !!profile.shippingState

  return (
    <WholesaleCartProvider>
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Wholesale shop
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D]">
            Stock up to resell
          </h1>
          <p className="mt-2 max-w-2xl font-body text-[13.5px] text-[#12372D]/70">
            Buy at wholesale price. After you place an order, admin confirms your
            payment, packs the stock, and ships to your address. You then resell via
            your own channels and keep the full margin.
          </p>
        </header>

        {!shippingReady ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} />
            <div className="text-[12.5px] text-amber-900">
              <p className="font-semibold">Add a shipping address before checkout</p>
              <p className="mt-0.5 text-amber-800/85">
                You can still browse and add to cart, but you&apos;ll need a saved
                shipping address to place the order.{' '}
                <Link href="/agent/profile" className="font-semibold underline">
                  Add one in Profile →
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        <WholesaleShopClient catalog={catalog} />
      </div>
    </WholesaleCartProvider>
  )
}
