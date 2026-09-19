import Link from 'next/link'
import {
  Gift,
  Users,
  Award,
  Cake,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getWallet } from '@/lib/promos/queries'
import { bucketWallet } from '@/lib/promos/format'

import WalletBalanceHero from '@/components/account/WalletBalanceHero'
import PromoCard from '@/components/account/PromoCard'
import PromoClaimForm from '@/components/account/PromoClaimForm'
import PromoLockedCard from '@/components/account/PromoLockedCard'
import PromoHistoryList from '@/components/account/PromoHistoryList'

export const metadata = {
  title: 'Promo Wallet',
}

export default async function PromosPage() {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'there'

  const supabase = await createClient()
  const wallet = customerId ? await getWallet(supabase, customerId) : []
  const { active, used, expired } = bucketWallet(wallet)

  // Featured = first active (already sorted by soonest expiry).
  // Remaining go in the grid below.
  const featured = active[0] ?? null
  const others = active.slice(1)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-7">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header>
        <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          <Gift className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
          Promo Wallet
        </span>
        <h1
          className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
          style={{ letterSpacing: '-0.025em' }}
        >
          Hello, {firstName}.{' '}
          <span
            className="italic font-normal text-[#006B3C]/70"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Your vouchers.
          </span>
        </h1>
      </header>

      {/* ── WALLET BALANCE HERO ──────────────────────────────────── */}
      <WalletBalanceHero active={active} />

      {/* ── FEATURED VOUCHER (the soonest-expiring active) ──────── */}
      {featured && (
        <section>
          <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            Featured
          </h2>
          <PromoCard item={featured} variant="featured" />
        </section>
      )}

      {/* ── CLAIM A CODE ─────────────────────────────────────────── */}
      <PromoClaimForm />

      {/* ── OTHER ACTIVE VOUCHERS ────────────────────────────────── */}
      {others.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            Also in your wallet
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((item) => (
              <PromoCard key={item.grant.id} item={item} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {/* ── EARN MORE — LOCKED ROADMAP ───────────────────────────── */}
      <section>
        <div className="mb-3">
          <h2 className="font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            Earn more
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-[#12372D]/55">
            Rewards we&apos;re building. They&apos;ll land here automatically.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PromoLockedCard
            icon={Users}
            title="Refer a friend"
            description="Both of you save RM 20 when they place their first order."
          />
          <PromoLockedCard
            icon={Award}
            title="Loyalty rewards"
            description="Unlock a free Abhyanga after your fifth treatment with us."
          />
          <PromoLockedCard
            icon={Cake}
            title="Birthday treat"
            description="RM 25 off the month of your birthday — our gift to you."
          />
        </div>
      </section>

      {/* ── REDEMPTION HISTORY ──────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          History
        </h2>
        <PromoHistoryList used={used} expired={expired} />
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section
        className="rounded-3xl border border-[#006B3C]/8 bg-white px-5 py-5 sm:px-6"
        style={{
          boxShadow:
            '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
            <Sparkles className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
          </span>
          <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
            How it works
          </h2>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B58A3B]" />
            <span className="font-body text-[12.5px] text-[#12372D]/70" style={{ lineHeight: 1.55 }}>
              One promo per order — vouchers don&apos;t stack.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B58A3B]" />
            <span className="font-body text-[12.5px] text-[#12372D]/70" style={{ lineHeight: 1.55 }}>
              Vouchers expire on the date shown — no extensions.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B58A3B]" />
            <span className="font-body text-[12.5px] text-[#12372D]/70" style={{ lineHeight: 1.55 }}>
              Minimum spend applies before tax and shipping.
            </span>
          </li>
        </ul>
      </section>

      {/* ── BROWSE LINK ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center pt-1">
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55 transition-colors hover:text-[#B58A3B]"
        >
          Browse products to redeem
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
