import {
  User,
  Stethoscope,
  Bell,
  ShieldCheck,
  Lock,
} from 'lucide-react'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getLatestResult } from '@/lib/quizzes/queries'
import { getAppointmentStats } from '@/lib/dashboard/appointment-queries'
import { getCustomerOrderStats } from '@/lib/dashboard/order-queries'

import ProfileHero from '@/components/account/ProfileHero'
import WellnessSnapshot from '@/components/account/WellnessSnapshot'
import SectionCard from '@/components/account/SectionCard'
import IdentityForm from '@/components/account/IdentityForm'
import AvatarUploader from '@/components/account/AvatarUploader'
import AccountDangerZone from '@/components/account/AccountDangerZone'
import HealthIntakeForm from '@/components/account/HealthIntakeForm'
import PreferencesForm from '@/components/account/PreferencesForm'
import PasswordChangeForm from '@/components/account/PasswordChangeForm'
import MfaSetupPanel from '@/components/account/MfaSetupPanel'

export const metadata = {
  title: 'My Profile',
}

const monthYearFormat = new Intl.DateTimeFormat('en-MY', {
  month: 'short',
  year: 'numeric',
})

export default async function ProfilePage() {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const profile = me?.profile

  const supabase = await createClient()
  const [latestPrakriti, apptStats, orderStats] = await Promise.all([
    customerId ? getLatestResult(supabase, customerId, 'prakriti') : Promise.resolve(null),
    customerId
      ? getAppointmentStats(supabase, customerId)
      : Promise.resolve({
          upcomingCount: 0,
          completedThisYear: 0,
          totalCount: 0,
          lastCompletedAt: null,
        }),
    customerId
      ? getCustomerOrderStats(supabase, customerId)
      : Promise.resolve({ totalOrders: 0, totalSpent: 0 }),
  ])

  const memberSinceLabel = profile?.created_at
    ? monthYearFormat.format(new Date(profile.created_at))
    : '—'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-7">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <ProfileHero
        fullName={profile?.full_name ?? null}
        email={me?.email ?? null}
        userId={profile?.id ?? ''}
        memberSinceLabel={memberSinceLabel}
        archetypeKey={latestPrakriti?.result.archetypeKey ?? null}
      />

      {/* ── WELLNESS SNAPSHOT ────────────────────────────────────── */}
      <WellnessSnapshot
        archetypeKey={latestPrakriti?.result.archetypeKey ?? null}
        upcomingCount={apptStats.upcomingCount}
        totalAppointments={apptStats.totalCount}
        totalOrders={orderStats.totalOrders}
        totalSpentRm={orderStats.totalSpent}
      />

      {/* ── IDENTITY ─────────────────────────────────────────────── */}
      <SectionCard
        icon={User}
        title="Identity"
        subtitle="How we address you and find you in the system."
      >
        <div className="flex flex-col gap-6">
          <AvatarUploader
            userId={profile?.id ?? ''}
            fullName={profile?.full_name ?? null}
            initialUrl={profile?.avatar_url ?? null}
          />
          <IdentityForm
            initial={{
              full_name: profile?.full_name ?? null,
              email: me?.email ?? null,
              phone_number: profile?.phone_number ?? null,
              gender: profile?.gender ?? null,
              date_of_birth: profile?.date_of_birth ?? null,
              language: profile?.language ?? 'en',
            }}
          />
        </div>
      </SectionCard>

      {/* ── HEALTH INTAKE ────────────────────────────────────────── */}
      <SectionCard
        icon={Stethoscope}
        title="Health intake"
        subtitle="Vaidya uses this to keep you safe before every prescription."
        tone="sensitive"
        badge={
          <span className="inline-flex items-center gap-1 rounded-full border border-[#B58A3B]/35 bg-[#B58A3B]/[0.1] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#B58A3B]">
            <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.2} />
            PDPA-protected
          </span>
        }
      >
        <HealthIntakeForm
          initial={{
            allergies: profile?.allergies ?? null,
            current_medications: profile?.current_medications ?? null,
            medical_conditions: profile?.medical_conditions ?? null,
            height_cm: profile?.height_cm ?? null,
            weight_kg: profile?.weight_kg ?? null,
          }}
        />
      </SectionCard>

      {/* ── PREFERENCES ──────────────────────────────────────────── */}
      <SectionCard
        icon={Bell}
        title="Communication preferences"
        subtitle="How and when we reach you."
      >
        <PreferencesForm
          initial={{
            marketing_opt_in: profile?.marketing_opt_in ?? false,
            whatsapp_reminders_opt_in: profile?.whatsapp_reminders_opt_in ?? true,
            email_reminders_opt_in: profile?.email_reminders_opt_in ?? true,
            treatment_followups_opt_in: profile?.treatment_followups_opt_in ?? true,
          }}
        />
      </SectionCard>

      {/* ── SECURITY ─────────────────────────────────────────────── */}
      <SectionCard
        icon={Lock}
        title="Security"
        subtitle="Change your password and turn on two-factor authentication."
      >
        <div className="flex flex-col gap-5">
          <PasswordChangeForm />
          <MfaSetupPanel enrolled={profile?.mfa_enrolled ?? false} />
        </div>
      </SectionCard>

      {/* ── DANGER ZONE ──────────────────────────────────────────── */}
      <AccountDangerZone />
    </div>
  )
}
