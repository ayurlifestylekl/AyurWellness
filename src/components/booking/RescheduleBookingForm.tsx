'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

import SlotPicker from './SlotPicker'
import type {
  RescheduleBookingInput,
  RescheduleFormBooking,
} from '@/lib/booking/reschedule'
import type { ManagementActionResult } from '@/lib/booking/management-actions'
import { fmtMY } from '@/lib/datetime'

type RescheduleAction = (
  input: RescheduleBookingInput,
) => Promise<ManagementActionResult<{ appointmentIds: string[] }>>

const REJECTED_ACTION_FAILURE = {
  code: 'PROVIDER_ERROR' as const,
  error: 'We could not reschedule the booking right now. No changes were made.',
}

export async function runRescheduleAction(
  action: RescheduleAction,
  input: RescheduleBookingInput,
): Promise<ManagementActionResult<{ appointmentIds: string[] }>> {
  try {
    return await action(input)
  } catch {
    return REJECTED_ACTION_FAILURE
  }
}

export default function RescheduleBookingForm({
  anchorId,
  bookings,
  action,
}: {
  anchorId: string
  bookings: RescheduleFormBooking[]
  action: RescheduleAction
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const anchor = bookings.find((booking) => booking.id === anchorId) ?? bookings[0]
  const isGroup = bookings.length > 1
  const [wholeGroup, setWholeGroup] = useState(false)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const selectedBookings = useMemo(
    () => wholeGroup ? bookings : anchor ? [anchor] : [],
    [anchor, bookings, wholeGroup],
  )
  if (!anchor) return null

  const selectedValue = selections[anchor.id] ?? ''
  const choose = (iso: string) => {
    setError(null)
    setSuccess(false)
    setSelections((current) => {
      const next = { ...current }
      for (const booking of selectedBookings) next[booking.id] = iso
      return next
    })
  }
  const ready = selectedBookings.length > 0
    && selectedBookings.every((booking) => !!selections[booking.id])

  const submit = () => {
    if (!ready || pending) return
    setError(null)
    startTransition(async () => {
      const appointmentIds = selectedBookings.map((booking) => booking.id)
      const result = await runRescheduleAction(action, {
        anchorId,
        appointmentIds,
        token: searchParams.get('t'),
        selections: Object.fromEntries(appointmentIds.map((id) => [id, selections[id]])),
        wholeGroup,
      })
      if (!('ok' in result)) {
        // Keep the original appointment card and chosen slot untouched so the
        // customer can correct the selection without losing context.
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-accent/15">
      <h3 className="font-heading text-[13px] font-bold text-primary">Choose a new appointment</h3>
      <p className="mt-1 font-body text-[12.5px] leading-5 text-dark/60">
        Your existing booking stays unchanged unless every selected appointment can move.
      </p>

      {isGroup && (
        <div className="mt-4">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Who to reschedule</legend>
            <button
              type="button"
              onClick={() => { setWholeGroup(false); setError(null); setSuccess(false) }}
              className={choiceClass(!wholeGroup)}
            >
              {anchor.patientName} only
            </button>
            <button
              type="button"
              onClick={() => { setWholeGroup(true); setError(null); setSuccess(false) }}
              className={choiceClass(wholeGroup)}
            >
              Whole group
            </button>
          </fieldset>
          {!wholeGroup && (
            <p className="mt-2 font-body text-[11.5px] leading-5 text-dark/55">
              Moving one guest separates this appointment from group management.
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        {wholeGroup ? (
          <SlotPicker
            treatmentId={null}
            gender=""
            mode="treatment"
            members={bookings.map((booking) => ({
              gender: booking.patientGender,
              treatmentId: booking.treatmentId,
            }))}
            value={selectedValue}
            onChange={choose}
            label="New time for the whole group"
            required
          />
        ) : (
          <SlotPicker
            treatmentId={anchor.treatmentId}
            gender={anchor.patientGender}
            mode={anchor.bookingKind}
            value={selectedValue}
            onChange={choose}
            label="New appointment time"
            required
          />
        )}
      </div>

      {ready && (
        <div className="mt-4 rounded-xl bg-cream/70 p-4 font-body text-[12.5px] text-dark/65">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            Confirm the change
          </p>
          <ul className="mt-2 space-y-2">
            {selectedBookings.map((booking) => (
              <li key={booking.id}>
                <span className="font-semibold text-primary">{booking.patientName}</span>
                {' · '}{fmtMY(booking.oldStart, { dateStyle: 'medium', timeStyle: 'short' })}
                {' → '}{fmtMY(selections[booking.id], { dateStyle: 'medium', timeStyle: 'short' })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-3 font-body text-[12.5px] text-red-700">{error}</p>}
      {success && (
        <p role="status" className="mt-3 font-body text-[12.5px] text-green-700">
          Your appointment has been rescheduled.
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ready || pending}
        className="mt-4 rounded-full bg-primary px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? 'Checking availability…' : 'Confirm new time'}
      </button>
    </section>
  )
}

function choiceClass(selected: boolean): string {
  return [
    'rounded-full border px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em]',
    selected ? 'border-primary bg-primary text-white' : 'border-accent/25 bg-white text-primary',
  ].join(' ')
}
