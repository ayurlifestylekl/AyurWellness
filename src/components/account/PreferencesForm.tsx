'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, MessageCircle, Mail, Bell, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile/updateProfile'

interface InitialValues {
  marketing_opt_in: boolean
  whatsapp_reminders_opt_in: boolean
  email_reminders_opt_in: boolean
  treatment_followups_opt_in: boolean
}

interface PreferencesFormProps {
  initial: InitialValues
}

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[#006B3C]' : 'bg-[#006B3C]/15'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function PreferencesForm({ initial }: PreferencesFormProps) {
  const [whatsappReminders, setWhatsappReminders] = useState(initial.whatsapp_reminders_opt_in)
  const [emailReminders, setEmailReminders] = useState(initial.email_reminders_opt_in)
  const [treatmentFollowups, setTreatmentFollowups] = useState(initial.treatment_followups_opt_in)
  const [marketing, setMarketing] = useState(initial.marketing_opt_in)
  const [isPending, startTransition] = useTransition()

  const isDirty =
    whatsappReminders !== initial.whatsapp_reminders_opt_in ||
    emailReminders !== initial.email_reminders_opt_in ||
    treatmentFollowups !== initial.treatment_followups_opt_in ||
    marketing !== initial.marketing_opt_in

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateProfile({
        whatsapp_reminders_opt_in: whatsappReminders,
        email_reminders_opt_in: emailReminders,
        treatment_followups_opt_in: treatmentFollowups,
        marketing_opt_in: marketing,
      })
      if (res.ok) {
        toast.success('Preferences updated.')
      } else {
        toast.error(res.error ?? "Couldn't save.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        <PreferenceRow
          icon={MessageCircle}
          label="WhatsApp appointment reminders"
          description="Same-day and day-before reminders for your bookings."
          checked={whatsappReminders}
          onChange={setWhatsappReminders}
          disabled={isPending}
        />
        <PreferenceRow
          icon={Mail}
          label="Email appointment reminders"
          description="Calendar invitations and reminders by email."
          checked={emailReminders}
          onChange={setEmailReminders}
          disabled={isPending}
        />
        <PreferenceRow
          icon={Bell}
          label="Treatment follow-ups"
          description="Vaidya's check-ins after your visits."
          checked={treatmentFollowups}
          onChange={setTreatmentFollowups}
          disabled={isPending}
        />
        <PreferenceRow
          icon={Mail}
          label="Newsletter & offers"
          description="Occasional emails about seasonal therapies, new products, and clinic events. Opt-in only."
          checked={marketing}
          onChange={setMarketing}
          disabled={isPending}
          marketing
        />
      </ul>

      <p className="font-body text-[11px] italic text-[#12372D]/55">
        You can change any of these at any time. Appointment reminders are
        recommended — they cut no-shows by half.
      </p>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save preferences'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  )
}

interface PreferenceRowProps {
  icon: LucideIcon
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  marketing?: boolean
}

function PreferenceRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled,
  marketing,
}: PreferenceRowProps) {
  return (
    <li
      className={`flex items-start gap-4 rounded-2xl border border-[#006B3C]/8 px-4 py-3.5 transition-colors hover:border-[#B58A3B]/30 ${
        marketing ? 'bg-[#EDF4E7]/30' : 'bg-white'
      }`}
    >
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          marketing ? 'bg-[#B58A3B]/15' : 'bg-[#006B3C]/[0.06]'
        }`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${marketing ? 'text-[#B58A3B]' : 'text-[#006B3C]'}`}
          strokeWidth={1.8}
        />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="font-heading text-[13px] font-semibold text-[#006B3C]"
          style={{ letterSpacing: '-0.005em' }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 font-body text-[11.5px] text-[#12372D]/65"
          style={{ lineHeight: 1.55 }}
        >
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </li>
  )
}
