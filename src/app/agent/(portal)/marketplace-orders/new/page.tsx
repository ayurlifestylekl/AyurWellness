import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listActiveProductsForAgent,
  getMyAgentProfile,
} from '@/lib/agent/marketplace-orders/queries'
import AgentMarketplaceForm from './AgentMarketplaceForm'

export const metadata = { title: 'Submit Marketplace Sale · Partner' }
export const dynamic = 'force-dynamic'

export default async function NewAgentMarketplaceOrderPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const [products, agent] = await Promise.all([
    listActiveProductsForAgent(supabase),
    getMyAgentProfile(supabase, me.authId),
  ])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href="/agent/marketplace-orders"
        className="text-[11px] uppercase tracking-wider text-[#12372D]/55 hover:text-[#B58A3B]"
      >
        ← Back to marketplace sales
      </Link>
      <header>
        <h1 className="font-heading text-[24px] font-bold text-[#12372D]">
          Submit a marketplace sale
        </h1>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          Tell us about a sale you made on TikTok Shop, Shopee, Lazada, Instagram, or
          WhatsApp. The clinic admin will review and approve within ~24 hours, then your
          commission shows up in your earnings.
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {agent ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <p className="mt-2 text-[11.5px] text-[#12372D]/55">
            Submitting as <code className="font-mono">{(agent as { referral_code?: string }).referral_code}</code>{' '}
            · current rate{' '}
            <strong>{(agent as { commission_rate?: number }).commission_rate}%</strong>
          </p>
        ) : null}
      </header>
      <AgentMarketplaceForm products={products} />
    </div>
  )
}
