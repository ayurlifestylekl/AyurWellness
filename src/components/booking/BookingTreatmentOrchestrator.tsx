'use client'

import { useSearchParams } from 'next/navigation'
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react'
import { useState, useTransition } from 'react'

import type { Treatment, TreatmentCategory } from '@/types/treatments'
import type { HealthIntake, Gender } from '@/types/booking'

import BookingRequestForm from './BookingRequestForm'
import ConsultationRequiredNotice from './ConsultationRequiredNotice'
import TreatmentPicker from './TreatmentPicker'
import HealthIntakeFields from './HealthIntakeFields'
import SlotPicker from './SlotPicker'
import { parseDurationMins } from '@/lib/booking/duration'
import { updateBookingDetails, type EditableBooking } from '@/lib/booking/actions'

interface BookingTreatmentOrchestratorProps {
  categories: TreatmentCategory[]
  treatments: Treatment[]
  account?: { email: string | null; signedIn: boolean } | null
  editBookingId?: string | null
  editToken?: string | null
  editBooking?: EditableBooking | null
}

export default function BookingTreatmentOrchestrator({
  categories,
  treatments,
  account,
  editBookingId,
  editToken,
  editBooking,
}: BookingTreatmentOrchestratorProps) {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const fromConsultation = searchParams.get('from') // set when a cleared consultation unlocks a treatment
  const consultationToken = searchParams.get('ct')
  const selected = id ? treatments.find((t) => t._id === id) ?? null : null

  const [acceptedPolicies, setAcceptedPolicies] = useState(false)
  const [healthIntake, setHealthIntake] = useState<HealthIntake>({})
  const [gender, setGender] = useState<Gender | ''>(editBooking?.patientGender ?? '')
  const [editName, setEditName] = useState(editBooking?.patientName ?? '')
  const [editPhone, setEditPhone] = useState(editBooking?.patientPhone ?? '')
  const [editEmail, setEditEmail] = useState(editBooking?.patientEmail ?? '')
  const [editPreferredAt, setEditPreferredAt] = useState(editBooking?.preferredAt ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [editPending, startEdit] = useTransition()
  const isEdit = !!editBookingId

  const handleSaveEdit = () => {
    if (!selected || !editBookingId) return
    if (!editName.trim()) { setEditError('Please enter the patient name.'); return }
    if (!editPhone.trim()) { setEditError('Please enter a contact number.'); return }
    if (!editEmail.trim()) { setEditError('Please enter an email address.'); return }
    if (!gender) { setEditError('Please select a gender.'); return }
    if (!editPreferredAt) { setEditError('Please choose a preferred date and time.'); return }
    setEditError(null)
    startEdit(async () => {
      const res = await updateBookingDetails({
        appointmentId: editBookingId,
        token: editToken,
        treatmentId: selected._id,
        patientName: editName,
        patientPhone: editPhone,
        patientEmail: editEmail,
        patientGender: gender,
        preferredAt: editPreferredAt,
      })
      if ('error' in res) setEditError(res.error)
    })
  }

  const formTreatment = selected
    ? {
        id: selected._id,
        title: selected.title,
        duration: selected.duration,
        price: selected.price,
        priceLabel: selected.priceLabel,
        bookingLeadTimeHours: selected.bookingLeadTimeHours,
        requiresScalpDisclaimer: selected.requiresScalpDisclaimer,
        requiresHealthIntake: selected.requiresHealthIntake,
        minimumAge: selected.minimumAge,
        specialTags: selected.specialTags,
      }
    : null
  const selectedImageUrl = selected?.imageUrl || '/authentic-ayurveda.jpg'

  const selectedDurationMins = selected ? parseDurationMins(selected.duration) : 0
  const isShortTherapy = selectedDurationMins === 30 || selectedDurationMins === 45

  // Directly-bookable therapies a group guest can pick from (excludes
  // enquiry-only, consultation-first, and short 30/45min therapies).
  const treatmentOptions = treatments
    .filter((t) => {
      const mins = parseDurationMins(t.duration)
      return t.bookingType !== 'enquiry' && !t.requiresConsultation && mins !== 30 && mins !== 45
    })
    .map((t) => ({
      id: t._id,
      title: t.title,
      price: t.price,
      requiresScalpDisclaimer: t.requiresScalpDisclaimer,
      requiresHealthIntake: t.requiresHealthIntake,
      minimumAge: t.minimumAge,
      specialTags: t.specialTags,
    }))

  const isEnquiry = selected?.bookingType === 'enquiry' || isShortTherapy
  // A consultation is required first UNLESS this booking follows a cleared one.
  const needsConsult =
    !!selected &&
    (selected.requiresConsultation || selected.bookingType === 'consultation') &&
    !fromConsultation

  return (
    <div className={selected ? "grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 lg:gap-16 items-start" : "flex flex-col gap-10"}>
      
      {/* Left Column (or Top on mobile) */}
      <div className="relative z-20 flex flex-col gap-6 lg:sticky lg:top-10">
        <TreatmentPicker categories={categories} treatments={treatments} selected={selected} />
        
        {selected && (
          <div className="hidden lg:flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl shadow-accent/5 ring-1 ring-accent/10">
            {/* Premium authentic image */}
            <div
              className="h-64 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${selectedImageUrl}')` }}
            />
            <div className="flex flex-col items-center p-8 text-center">
              <span className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Selected</span>
              <h3 className="mb-3 font-heading text-2xl font-bold leading-tight text-primary">{selected.title}</h3>
              <p className="mb-6 font-body text-sm text-dark/60">{selected.description ?? 'A restorative therapy session for deep relaxation.'}</p>
              
              <div className="flex w-full items-center justify-between border-t border-accent/10 pt-5">
                <span className="font-heading text-[12px] font-semibold text-dark/60">{selected.duration ? selected.duration : '30-90 min'}</span>
                <span className="font-heading text-lg font-bold text-primary">
                  {selected.priceLabel || (typeof selected.price === 'number' ? `RM${selected.price}` : 'Consultation')}
                </span>
              </div>
            </div>
          </div>
        )}

        {selected && !isEnquiry && !needsConsult && (
          <div className="hidden lg:flex flex-col gap-3 mt-2">
            <HealthIntakeFields
              value={healthIntake}
              onChange={setHealthIntake}
              gender={gender}
              requiresScalpDisclaimer={selected?.requiresScalpDisclaimer}
              requiresHealthIntake={selected?.requiresHealthIntake}
              specialTags={selected?.specialTags}
            />
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-10">
        {!selected && <PickerPlaceholder hasCatalog={treatments.length > 0} />}

        {selected && isEnquiry && <EnquiryNotice title={selected.title} />}

        {selected && !isEnquiry && needsConsult && (
          <div className="flex flex-col gap-6">
            <ConsultationRequiredNotice treatment={selected} />
            <BookingRequestForm 
              bookingKind="consultation" 
              treatment={formTreatment} 
              account={account} 
              accepted={acceptedPolicies}
              setAccepted={setAcceptedPolicies}
              health={healthIntake}
              setHealth={setHealthIntake}
              gender={gender}
              setGender={setGender}
            />
          </div>
        )}

        {selected && !isEnquiry && !needsConsult && !isEdit && (
          <BookingRequestForm
            key={selected._id}
            bookingKind="treatment"
            treatment={formTreatment}
            treatmentOptions={treatmentOptions}
            account={account}
            parentConsultationId={fromConsultation}
            parentConsultationToken={consultationToken}
            accepted={acceptedPolicies}
            setAccepted={setAcceptedPolicies}
            health={healthIntake}
            setHealth={setHealthIntake}
            gender={gender}
            setGender={setGender}
          />
        )}

        {selected && !isEnquiry && !needsConsult && isEdit && (
          <div className="rounded-2xl border border-accent/30 bg-white/70 p-8">
            <span className="mb-2 block text-center font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Edit booking</span>
            <h2 className="text-center font-heading text-[20px] font-extrabold text-primary">
              {selected.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center font-body text-[14px] leading-relaxed text-dark/65">
              Update the treatment, time, or your contact details below.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Patient name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Contact number</span>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Email</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Gender (for therapist matching)</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  required
                >
                  <option value="">Select…</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
            </div>

            <div className="mt-4">
              <SlotPicker
                treatmentId={selected._id}
                gender={gender}
                mode="treatment"
                value={editPreferredAt}
                onChange={setEditPreferredAt}
                label="Preferred date & time"
                required
              />
            </div>

            {editError && (
              <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700">
                {editError}
              </p>
            )}
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editPending}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {editPending ? 'Saving…' : 'Save changes'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EnquiryNotice({ title }: { title: string }) {
  const href = `https://wa.me/601163393436?text=${encodeURIComponent(`Hi, I'd like to enquire about ${title}.`)}`
  return (
    <div className="rounded-2xl border border-accent/30 bg-white/70 px-8 py-10 text-center">
      <MessageCircle className="mx-auto h-6 w-6 text-accent" strokeWidth={2} aria-hidden />
      <h2 className="mt-3 font-heading text-[20px] font-extrabold text-primary">{title} is enquiry only</h2>
      <p className="mx-auto mt-2 max-w-md font-body text-[14px] leading-relaxed text-dark/65">
        Contact us for bookings and enquiry.
      </p>
      <a
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
      >
        Enquire on WhatsApp
      </a>
    </div>
  )
}

function PickerPlaceholder({ hasCatalog }: { hasCatalog: boolean }) {
  return (
    <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-dashed border-primary/15 bg-white/60 px-8 py-14 text-center backdrop-blur sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(181, 138, 59,0.09) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(20, 148, 71,0.04) 0%, transparent 55%)',
        }}
      />
      <span className="relative inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-3 py-1.5">
        <Sparkles className="h-3 w-3 text-accent" strokeWidth={2.2} />
        <span className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          {hasCatalog ? 'Start Above' : 'Catalogue Loading'}
        </span>
      </span>
      <h2 className="relative max-w-md font-heading text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-primary sm:text-[26px]">
        {hasCatalog ? 'Pick a treatment to start your booking.' : 'Our catalogue is being prepared.'}
      </h2>
      <p className="relative max-w-md font-body text-[14px] leading-[1.7] text-dark/60 sm:text-[15px]">
        {hasCatalog
          ? 'Search by name, condition, or category, then request your preferred time.'
          : 'While we finish wiring up the treatment index, message us on WhatsApp and our team will get you booked.'}
      </p>
    </div>
  )
}
