import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfileFull } from '@/lib/agent/profile/queries'
import PersonalForm from './PersonalForm'
import PayoutForm from './PayoutForm'
import ShippingForm from './ShippingForm'

export const metadata = { title: 'Partner Profile' }
export const dynamic = 'force-dynamic'

export default async function AgentProfilePage() {
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
            Your account isn&apos;t linked to a sales agent profile yet. Contact
            admin to complete your partner setup.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Account
        </span>
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D]">
          Profile
        </h1>
        <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
          Your personal details, payout method, and shipping address (if you
          buy wholesale).
        </p>
      </header>

      {/* Read-only partner card */}
      <section className="rounded-3xl border border-[#12372D]/10 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ReadOnlyField label="Referral code" value={profile.referralCode} mono />
          <ReadOnlyField
            label="Commission rate"
            value={`${profile.commissionRate}%`}
          />
          <ReadOnlyField
            label="Status"
            value={profile.status === 'suspended' ? 'Suspended' : 'Active'}
            tone={profile.status === 'suspended' ? 'red' : 'green'}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.canAffiliate ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
              Affiliate · earns commission on referred sales
            </span>
          ) : null}
          {profile.canWholesale ? (
            <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-800">
              Reseller · buys wholesale to resell
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[11.5px] italic text-[#12372D]/55">
          Referral code, commission rate, and capabilities are set by admin.
          Contact them to change.
        </p>
      </section>

      <PersonalForm
        fullName={profile.fullName ?? ''}
        phoneNumber={profile.phoneNumber ?? ''}
        email={profile.email ?? ''}
      />

      {profile.canAffiliate ? (
        <PayoutForm
          method={profile.payoutMethod ?? 'bank_transfer'}
          bankName={profile.payoutBankName ?? ''}
          accountName={profile.payoutAccountName ?? ''}
          accountNo={profile.payoutAccountNo ?? ''}
          tngPhone={profile.payoutTngPhone ?? ''}
        />
      ) : null}

      {profile.canWholesale ? (
        <ShippingForm
          address={profile.shippingAddress ?? ''}
          postcode={profile.shippingPostcode ?? ''}
          state={profile.shippingState ?? ''}
        />
      ) : null}
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
  mono,
  tone,
}: {
  label: string
  value: string
  mono?: boolean
  tone?: 'green' | 'red'
}) {
  const valueClass =
    tone === 'red'
      ? 'text-red-700'
      : tone === 'green'
        ? 'text-emerald-700'
        : 'text-[#12372D]'
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/55">
        {label}
      </p>
      <p
        className={`mt-1 ${mono ? 'font-mono' : 'font-heading'} text-[15px] font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  )
}
