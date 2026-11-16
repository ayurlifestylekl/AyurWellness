import { createClient } from '@/lib/supabase/server'
import { getTelegramSettings } from '@/lib/admin/settings/queries'
import TelegramSettings from './TelegramSettings'

export const metadata = { title: 'Settings · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const telegram = await getTelegramSettings(supabase)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Configuration
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Settings
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          Staff alerts. Clinic details, booking rules and payment settings are part of the website
          itself — ask your developer to change them.
        </p>
      </header>

      {/* The old clinic-wide form (site_settings) was removed from here: nothing on the
          site reads those values, so editing them changed nothing. SettingsForm and the
          site_settings queries are kept for when they are wired up. */}
      <TelegramSettings initial={telegram} />
    </div>
  )
}
