'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import type { BookingKind, Gender, HealthIntake } from '@/types/booking'
import type { GroupGuest } from '@/lib/booking/actions'
import { createInstantTreatmentBooking, createInstantGroupBooking, createInstantConsultation } from '@/lib/booking/instant'
import { submitInstantSingleBooking } from '@/lib/booking/instant-rules'
import HealthIntakeFields from './HealthIntakeFields'
import PolicyDisclaimers from './PolicyDisclaimers'
import SlotPicker from './SlotPicker'
import PhoneInput from './PhoneInput'

/** A treatment a group guest can choose from. */
export interface GroupTreatmentOption {
  id: string
  title: string
  price?: number | null
  requiresScalpDisclaimer?: boolean
  requiresHealthIntake?: boolean
  minimumAge?: number | null
  specialTags?: string[]
}

interface BookingRequestFormProps {
  bookingKind: BookingKind
  treatment?: {
    id: string
    title: string
    duration?: string | null
    price?: number | null
    priceLabel?: string | null
    bookingLeadTimeHours?: number | null
    requiresScalpDisclaimer?: boolean
    requiresHealthIntake?: boolean
    minimumAge?: number | null
    specialTags?: string[]
  } | null
  /** Bookable treatments a group guest can pick from (per-guest therapy choice). */
  treatmentOptions?: GroupTreatmentOption[]
  account?: { email: string | null; signedIn: boolean } | null
  parentConsultationId?: string | null
  parentConsultationToken?: string | null
  accepted?: boolean
  setAccepted?: (v: boolean) => void
  health?: HealthIntake
  setHealth?: (v: HealthIntake) => void
  gender?: Gender | ''
  setGender?: (v: Gender | '') => void
}

type GuestRow = {
  name: string
  gender: Gender | ''
  age: string
  treatmentId: string
  /** This guest's own slot (ISO) — guests may pick different dates & times. */
  preferredAt: string
  /** This guest's own health intake. */
  health: HealthIntake
}
const MAX_GUESTS = 6
const emptyGuest = (treatmentId = ''): GuestRow => ({ name: '', gender: '', age: '', treatmentId, preferredAt: '', health: {} })

export default function BookingRequestForm({
  bookingKind,
  treatment,
  treatmentOptions,
  account,
  parentConsultationId,
  parentConsultationToken,
  accepted: controlledAccepted,
  setAccepted: setControlledAccepted,
  health: controlledHealth,
  setHealth: setControlledHealth,
  gender: controlledGender,
  setGender: setControlledGender,
}: BookingRequestFormProps) {
  const router = useRouter()
  const signedIn = account?.signedIn ?? false
  const canGroup = bookingKind === 'treatment'
  const defaultTreatmentId = treatment?.id ?? ''

  // Treatments a guest can pick from. Falls back to the page's treatment.
  const options: GroupTreatmentOption[] =
    treatmentOptions && treatmentOptions.length > 0
      ? treatmentOptions
      : treatment
        ? [{
            id: treatment.id,
            title: treatment.title,
            price: treatment.price,
            requiresScalpDisclaimer: treatment.requiresScalpDisclaimer,
            requiresHealthIntake: treatment.requiresHealthIntake,
            minimumAge: treatment.minimumAge,
            specialTags: treatment.specialTags,
          }]
        : []
  const priceById = new Map(options.map((o) => [o.id, typeof o.price === 'number' ? o.price : null]))
  const flagsById = new Map(options.map((o) => [o.id, o]))

  const validateAge = (raw: string, minimumAge?: number | null): string | null => {
    if (typeof minimumAge !== 'number') return null
    const n = Number(raw)
    if (!raw || !Number.isFinite(n) || n < minimumAge) {
      return `This therapy is for ages ${minimumAge} and above.`
    }
    return null
  }
  const validateHealth = (h: HealthIntake, flags?: GroupTreatmentOption | null): string | null => {
    if (!flags) return null
    if (flags.requiresScalpDisclaimer && !h.noDandruffScalpIssues) {
      return 'Please confirm you do not have dandruff or scalp issues, or contact us on WhatsApp to discuss.'
    }
    if (flags.requiresHealthIntake && flags.specialTags?.includes('oldage') && !h.noSurgeryWoundSkinLesions) {
      return 'Please confirm you have no recent surgery, open wounds or skin lesions, or contact us on WhatsApp to discuss.'
    }
    if (flags.requiresHealthIntake && flags.specialTags?.includes('kids') && !h.noFeverColdFlu) {
      return 'Please confirm the child does not have fever, cold or flu, or contact us on WhatsApp to discuss.'
    }
    return null
  }

  const [partySize, setPartySize] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(account?.email ?? '')
  const [guests, setGuests] = useState<GuestRow[]>([emptyGuest(defaultTreatmentId), emptyGuest(defaultTreatmentId)])
  const [preferredAt, setPreferredAt] = useState('')
  const [age, setAge] = useState('')
  const [bookAsGuest, setBookAsGuest] = useState(!signedIn)
  const [internalAccepted, setInternalAccepted] = useState(false)
  const [internalHealth, setInternalHealth] = useState<HealthIntake>({})
  const [internalGender, setInternalGender] = useState<Gender | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const accepted = controlledAccepted ?? internalAccepted
  const setAccepted = setControlledAccepted ?? setInternalAccepted
  const health = controlledHealth ?? internalHealth
  const setHealth = setControlledHealth ?? setInternalHealth
  const gender = controlledGender ?? internalGender
  const setGender = setControlledGender ?? setInternalGender

  const isGroup = canGroup && partySize > 1

  const resizeParty = (n: number) => {
    setPartySize(n)
    setPreferredAt('')
    if (n > 1) {
      setGuests((prev) => {
        const next = [...prev]
        while (next.length < n) next.push(emptyGuest(defaultTreatmentId))
        return next.slice(0, n)
      })
    }
  }

  const unitPrice = typeof treatment?.price === 'number' ? treatment.price : null
  const groupTotal = isGroup
    ? guests
        .slice(0, partySize)
        .reduce((sum, g) => sum + (priceById.get(g.treatmentId || defaultTreatmentId) ?? 0), 0)
    : 0
  const priceText =
    bookingKind === 'consultation'
      ? 'Free'
      : isGroup
        ? `RM${groupTotal} total`
        : treatment?.priceLabel || (unitPrice != null ? `RM${unitPrice}` : 'On consultation')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!phone.trim()) return setError('Please enter a contact number — we need it to confirm your booking.')
    // Digits (with optional +, spaces, dashes) only — customers sometimes type
    // their email here, which later breaks payment-gateway validation.
    if (!/^\+?[0-9 ()-]{7,20}$/.test(phone.trim())) {
      return setError('That contact number doesn’t look right — please enter digits only, e.g. 012-3456789.')
    }
    if (!email.trim()) return setError('Please enter an email — we need it to send your booking updates.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (!isGroup && !preferredAt) return setError('Please choose a preferred date and time.')
    if (!accepted) return setError('Please accept the booking policies to continue.')

    if (!isGroup && bookingKind === 'treatment') {
      const ageError = validateAge(age, treatment?.minimumAge)
      if (ageError) return setError(ageError)
      const healthError = validateHealth(health, treatment)
      if (healthError) return setError(healthError)
    }

    startTransition(async () => {
      let res
      if (isGroup) {
        const cleaned = guests.slice(0, partySize)
        if (cleaned.some((g) => !g.name.trim() || (g.gender !== 'male' && g.gender !== 'female'))) {
          setError('Please enter a name and gender for every guest.')
          return
        }
        if (options.length > 1 && cleaned.some((g) => !(g.treatmentId || defaultTreatmentId))) {
          setError('Please choose a therapy for every guest.')
          return
        }
        if (cleaned.some((g) => !g.preferredAt)) {
          setError('Please choose a date and time for every guest.')
          return
        }
        for (const g of cleaned) {
          const flags = flagsById.get(g.treatmentId || defaultTreatmentId)
          const ageError = validateAge(g.age, flags?.minimumAge)
          if (ageError) {
            setError(`${g.name.trim() || 'A guest'}: ${ageError}`)
            return
          }
          const healthError = validateHealth(g.health, flags)
          if (healthError) {
            setError(`${g.name.trim() || 'A guest'}: ${healthError}`)
            return
          }
        }
        res = await createInstantGroupBooking({
          treatmentId: treatment?.id ?? '',
          patientPhone: phone,
          patientEmail: email,
          isGuest: bookAsGuest || !signedIn,
          acceptedPolicies: accepted,
          guests: cleaned.map<GroupGuest>((g) => ({
            name: g.name,
            gender: g.gender as Gender,
            age: g.age ? Number(g.age) : null,
            treatmentId: g.treatmentId || defaultTreatmentId,
            preferredAt: new Date(g.preferredAt).toISOString(),
            healthIntake: g.health,
          })),
        })
      } else {
        if (!gender) return setError(bookingKind === 'consultation' ? 'Please select a gender.' : 'Please select a gender for therapist matching.')
        const payload = {
          treatmentId: treatment?.id ?? null,
          bookingKind,
          preferredAt: new Date(preferredAt).toISOString(),
          patientName: name,
          patientPhone: phone,
          patientEmail: email,
          patientGender: gender,
          isGuest: bookAsGuest || !signedIn,
          healthIntake: health,
          acceptedPolicies: accepted,
          age: age ? Number(age) : null,
          parentConsultationId: parentConsultationId ?? null,
          parentConsultationToken: parentConsultationToken ?? null,
        }
        res = await submitInstantSingleBooking(payload, {
          createTreatment: createInstantTreatmentBooking,
          createConsultation: createInstantConsultation,
        })
      }
      if ('error' in res) setError(res.error)
      else {
        // Free consultations are confirmed instantly — nothing to pay, go
        // straight to the status page. Treatments (single or group) still
        // owe payment, so go to checkout to pick a method.
        router.push(
          bookingKind === 'consultation'
            ? `/book/request/${res.id}?t=${res.token}`
            : `/book/request/${res.id}/checkout?t=${res.token}`,
        )
      }
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-12">
      
      {/* Header */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="mb-2 font-heading text-[28px] text-primary">Secure Your Serenity</h2>
          <p className="font-body text-[15px] text-dark/60">Complete the details below to confirm your luxury spa experience.</p>
        </div>
        <div className="text-right pb-1">
          <div className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-[#B58A3B]">Total</div>
          <div className="font-heading text-xl font-extrabold text-primary">{priceText}</div>
        </div>
      </div>

      {/* SECTION 1: PERSONAL INFO */}
      <div className="flex flex-col gap-6">
        <h3 className="flex items-center gap-3 border-b border-[#FFF9F2] pb-3 font-heading text-[22px] font-semibold text-primary">
          <span className="text-[#B58A3B]">01.</span> Personal Information
        </h3>

        {/* Account / guest toggle */}
        {signedIn ? (
          <label className="flex cursor-pointer items-center gap-3 mt-2">
            <input type="checkbox" checked={bookAsGuest} onChange={(e) => setBookAsGuest(e.target.checked)} className="h-5 w-5 rounded border-[#FFF9F2] text-[#B58A3B] focus:ring-[#B58A3B]" />
            <span className="font-body text-[14px] text-dark/75">Book as guest (don&apos;t attach to my account)</span>
          </label>
        ) : (
          <p className="font-body text-[14px] text-dark/60 mt-2">
            Booking as a guest.{' '}
            <Link href="/auth/login?next=/book" className="font-semibold text-accent underline-offset-2 hover:underline">Sign in</Link>{' '}
            to track your appointments.
          </p>
        )}

        {/* Party size (treatments only) */}
        {canGroup && (
          <Field label="How many guests?">
            <select value={partySize} onChange={(e) => resizeParty(Number(e.target.value))} className={inputCls}>
              {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n === 1 ? '1 guest (just me)' : `${n} guests`}</option>
              ))}
            </select>
          </Field>
        )}

        {/* Single guest details */}
        {!isGroup && (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Full name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} required={!isGroup} className={inputCls} placeholder="Your name" />
            </Field>
            <Field label={bookingKind === 'consultation' ? 'Gender' : 'Gender (for therapist matching)'} required>
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputCls}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </Field>
            {bookingKind === 'treatment' && typeof treatment?.minimumAge === 'number' && (
              <Field label={`Age (must be ${treatment.minimumAge}+)`} required>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                  required
                  className={inputCls}
                  placeholder="Age"
                  inputMode="numeric"
                />
              </Field>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact number" required>
            <PhoneInput value={phone} onChange={setPhone} required />
          </Field>
          <Field label="Email" required>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={inputCls} placeholder="you@email.com" />
          </Field>
        </div>

        {/* Group guests */}
        {isGroup && (
          <fieldset className="mt-4 rounded-2xl border border-accent/20 bg-[#FFF9F2] p-5 sm:p-6">
            <legend className="px-2 font-heading text-[12px] font-bold uppercase tracking-[0.22em] text-[#B58A3B]">Guests</legend>
            <p className="mb-5 font-body text-[13px] italic text-dark/60">
              Each guest picks their own date &amp; time and gets a same-gender therapist
              {options.length > 1 ? ' — and can choose their own therapy.' : '.'}
            </p>
            <div className="space-y-4">
              {guests.slice(0, partySize).map((g, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-accent/15 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-[1fr_110px_72px] gap-3">
                    <input
                      value={g.name}
                      onChange={(e) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      className={inputCls}
                      placeholder={`Guest ${i + 1} name`}
                    />
                    <select
                      value={g.gender}
                      onChange={(e) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, gender: e.target.value as Gender } : x)))}
                      className={inputCls}
                    >
                      <option value="">Gender…</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                    <input
                      value={g.age}
                      onChange={(e) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, age: e.target.value.replace(/\D/g, '') } : x)))}
                      className={inputCls}
                      placeholder="Age"
                      inputMode="numeric"
                    />
                  </div>
                  {options.length > 1 && (
                    <select
                      value={g.treatmentId}
                      onChange={(e) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, treatmentId: e.target.value } : x)))}
                      className={inputCls}
                      aria-label={`Therapy for guest ${i + 1}`}
                    >
                      <option value="">Choose therapy…</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                          {typeof o.price === 'number' ? ` — RM${o.price}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <SlotPicker
                    treatmentId={g.treatmentId || defaultTreatmentId || null}
                    gender={g.gender}
                    mode="treatment"
                    value={g.preferredAt}
                    onChange={(iso) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, preferredAt: iso } : x)))}
                    label={`Date & time for ${g.name.trim() || `guest ${i + 1}`}`}
                    required
                  />
                  <details className="mt-2 rounded-xl border border-accent/15 bg-[#FFF9F2] px-4 py-3">
                    <summary className="cursor-pointer font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-dark/60 hover:text-primary">
                      Health details for {g.name.trim() || `guest ${i + 1}`} (optional)
                    </summary>
                    <div className="pt-4">
                      {(() => {
                        const guestFlags = flagsById.get(g.treatmentId || defaultTreatmentId)
                        return (
                          <HealthIntakeFields
                            embedded
                            radioGroup={`onPeriod-guest-${i}`}
                            value={g.health}
                            onChange={(v) => setGuests((p) => p.map((x, j) => (j === i ? { ...x, health: v } : x)))}
                            gender={g.gender}
                            requiresScalpDisclaimer={guestFlags?.requiresScalpDisclaimer}
                            requiresHealthIntake={guestFlags?.requiresHealthIntake}
                            specialTags={guestFlags?.specialTags}
                          />
                        )
                      })()}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {/* SECTION 2: DATE & TIME */}
      {!isGroup && (
        <div className="flex flex-col gap-6">
          <h3 className="flex items-center gap-3 border-b border-[#FFF9F2] pb-3 font-heading text-[22px] font-semibold text-primary">
            <span className="text-[#B58A3B]">02.</span> Preferred Date & Time
          </h3>
          <SlotPicker treatmentId={treatment?.id ?? null} gender={gender} mode={bookingKind === 'consultation' ? 'consultation' : 'treatment'} value={preferredAt} onChange={setPreferredAt} label="Select from available times" required />
        </div>
      )}

      {/* SECTION 3: HEALTH INTAKE (Mobile Only - Desktop shows under image) */}
      {!isGroup && (
        <div className="flex flex-col gap-6 lg:hidden">
          <h3 className="flex items-center gap-3 border-b border-[#FFF9F2] pb-3 font-heading text-[22px] font-semibold text-primary">
            <span className="text-[#B58A3B]">03.</span> Health Intake
          </h3>
          <p className="font-body text-[14px] text-dark/60 -mt-3">So our Vaidya can tailor and safely plan your therapy. Leave blank if not applicable.</p>
          <HealthIntakeFields
            value={health}
            onChange={setHealth}
            gender={gender}
            requiresScalpDisclaimer={bookingKind === 'treatment' ? treatment?.requiresScalpDisclaimer : false}
            requiresHealthIntake={bookingKind === 'treatment' ? treatment?.requiresHealthIntake : false}
            specialTags={bookingKind === 'treatment' ? treatment?.specialTags : []}
          />
        </div>
      )}

      {/* SECTION 4: POLICIES */}
      <div className="flex flex-col gap-6">
        <PolicyDisclaimers accepted={accepted} onAcceptedChange={setAccepted} />
      </div>

      {/* ERROR & SUBMIT */}
      <div className="mt-8 pt-10 border-t border-[#FFF9F2] flex flex-col gap-6">
        {error && (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-50 p-4 font-body text-[14px] text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#B58A3B] px-8 font-heading text-[13px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (bookingKind === 'consultation' ? 'Confirming…' : 'Reserving your slot…') : bookingKind === 'consultation' ? 'Confirm free consultation' : 'Continue to payment'}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="text-center font-body text-[13px] italic text-dark/50">
          {bookingKind === 'consultation'
            ? "You're confirmed instantly — no review needed."
            : "Your slot is held while you pay — it's released if payment isn't completed in time."}
        </p>
      </div>
    </form>
  )
}

const inputCls =
  'w-full rounded-xl border border-accent/20 bg-[#FFF9F2] px-4 py-3.5 font-body text-[15px] text-dark placeholder:text-[#B58A3B] transition-all duration-200 focus:border-[#B58A3B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#B58A3B]/10'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-heading text-[11px] font-bold uppercase tracking-[0.15em] text-dark/70">
        {label} {required && <span className="text-[#B58A3B]">*</span>}
      </span>
      {children}
    </label>
  )
}
