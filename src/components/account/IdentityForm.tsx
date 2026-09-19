'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile/updateProfile'

interface InitialValues {
  full_name: string | null
  email: string | null
  phone_number: string | null
  gender: 'male' | 'female' | null
  date_of_birth: string | null
  language: 'en' | 'ms'
}

interface IdentityFormProps {
  initial: InitialValues
}

type GenderChoice = 'male' | 'female' | 'unspecified'

export default function IdentityForm({ initial }: IdentityFormProps) {
  const [fullName, setFullName] = useState(initial.full_name ?? '')
  const [gender, setGender] = useState<GenderChoice>(
    initial.gender ?? 'unspecified'
  )
  const [dob, setDob] = useState(initial.date_of_birth ?? '')
  const [language, setLanguage] = useState<'en' | 'ms'>(initial.language ?? 'en')
  const [isPending, startTransition] = useTransition()

  const isDirty =
    fullName.trim() !== (initial.full_name ?? '') ||
    (gender === 'unspecified' ? null : gender) !== initial.gender ||
    dob !== (initial.date_of_birth ?? '') ||
    language !== (initial.language ?? 'en')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = fullName.trim()
    if (!trimmed) {
      toast.error('Name cannot be empty.')
      return
    }
    startTransition(async () => {
      const res = await updateProfile({
        full_name: trimmed,
        gender: gender === 'unspecified' ? null : gender,
        date_of_birth: dob || null,
        language,
      })
      if (res.ok) {
        toast.success('Identity updated.')
      } else {
        toast.error(res.error ?? "Couldn't save.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Full name */}
      <div>
        <label
          htmlFor="profile-name"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Full name
        </label>
        <input
          id="profile-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={120}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
        />
      </div>

      {/* Email + phone (read-only, auth-managed) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Email
          </label>
          <div className="relative mt-2">
            <input
              type="email"
              value={initial.email ?? ''}
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-[#006B3C]/10 bg-[#EDF4E7]/40 px-4 py-2.5 pr-10 font-body text-[13.5px] text-[#006B3C]/70"
            />
            <Lock
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#006B3C]/35"
              strokeWidth={2}
            />
          </div>
          <p className="mt-1.5 font-body text-[10.5px] italic text-[#12372D]/55">
            Email changes require verification. Message Vaidya to update.
          </p>
        </div>
        <div>
          <label className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Phone
          </label>
          <div className="relative mt-2">
            <input
              type="tel"
              value={initial.phone_number ?? ''}
              readOnly
              className="w-full cursor-not-allowed rounded-2xl border border-[#006B3C]/10 bg-[#EDF4E7]/40 px-4 py-2.5 pr-10 font-body text-[13.5px] text-[#006B3C]/70"
            />
            <Lock
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#006B3C]/35"
              strokeWidth={2}
            />
          </div>
          <p className="mt-1.5 font-body text-[10.5px] italic text-[#12372D]/55">
            Phone changes require verification. Message Vaidya to update.
          </p>
        </div>
      </div>

      {/* Gender + DOB */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Gender
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(
              [
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'unspecified', label: 'Prefer not to say' },
              ] as { value: GenderChoice; label: string }[]
            ).map((opt) => {
              const isActive = gender === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  disabled={isPending}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 font-heading text-[11.5px] font-semibold transition-all ${
                    isActive
                      ? 'border-[#B58A3B] bg-[#B58A3B] text-[#12372D]'
                      : 'border-[#006B3C]/12 bg-white text-[#006B3C]/65 hover:border-[#B58A3B]/40 hover:text-[#006B3C]'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 font-body text-[10.5px] italic text-[#12372D]/55">
            Same-gender therapies are matched from this.
          </p>
        </div>
        <div>
          <label
            htmlFor="profile-dob"
            className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
          >
            Date of birth
          </label>
          <input
            id="profile-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
          Language
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              { value: 'en', label: 'English' },
              { value: 'ms', label: 'Bahasa Malaysia' },
            ] as { value: 'en' | 'ms'; label: string }[]
          ).map((opt) => {
            const isActive = language === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                disabled={isPending}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 font-heading text-[11.5px] font-semibold transition-all ${
                  isActive
                    ? 'border-[#B58A3B] bg-[#B58A3B] text-[#12372D]'
                    : 'border-[#006B3C]/12 bg-white text-[#006B3C]/65 hover:border-[#B58A3B]/40 hover:text-[#006B3C]'
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save identity'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  )
}
