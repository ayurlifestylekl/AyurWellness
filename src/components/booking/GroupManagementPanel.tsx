'use client'

import { Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  buildGroupRescheduleChanges,
} from '@/lib/booking/group-management'
import type { ManagementActionResult } from '@/lib/booking/management-actions'
import type { BookingManagementMember } from '@/lib/booking/management'
import type {
  RescheduleBookingInput,
  RescheduleFormBooking,
} from '@/lib/booking/reschedule'
import { fmtMY } from '@/lib/datetime'
import RescheduleBookingForm, { runRescheduleAction } from './RescheduleBookingForm'
import SlotPicker from './SlotPicker'

type RescheduleAction = (
  input: RescheduleBookingInput,
) => Promise<ManagementActionResult<{ appointmentIds: string[] }>>

export default function GroupManagementPanel({
  anchorId,
  bookings,
  members,
  action,
}: {
  anchorId: string
  bookings: RescheduleFormBooking[]
  members: BookingManagementMember[]
  action: RescheduleAction
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]))
  const activeBookings = members
    .map((member) => bookingById.get(member.id))
    .filter((booking): booking is RescheduleFormBooking => !!booking)
  const wholeGroupAvailable = activeBookings.length === members.length
    && members.every((member) => member.canReschedule)
  const wholeGroupReady = wholeGroupAvailable
    && activeBookings.every((booking) => !!selections[booking.id])

  const choose = (appointmentId: string, iso: string) => {
    setError(null)
    setSuccess(false)
    setSelections((current) => ({ ...current, [appointmentId]: iso }))
  }

  const submitWholeGroup = () => {
    if (!wholeGroupReady || pending) return
    setError(null)
    startTransition(async () => {
      let changes
      try {
        changes = buildGroupRescheduleChanges(activeBookings, selections, { wholeGroup: true })
      } catch {
        setError('Choose a new time for every active guest.')
        return
      }
      const result = await runRescheduleAction(action, {
        anchorId,
        appointmentIds: changes.map((change) => change.appointmentId),
        token: searchParams.get('t'),
        selections: Object.fromEntries(
          changes.map((change) => [change.appointmentId, change.newStart]),
        ),
        wholeGroup: true,
      })
      if (!('ok' in result)) {
        setError(result.error)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-accent/15">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="font-heading text-[13px] font-bold text-primary">Manage entire group</h3>
        </div>
        <p className="mt-1 font-body text-[12.5px] leading-5 text-dark/60">
          Choose a new appointment time for every active guest. The group moves only if every slot is available.
        </p>

        {wholeGroupAvailable ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {activeBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl bg-cream/55 p-4 ring-1 ring-accent/10">
                <p className="font-heading text-[12px] font-bold text-primary">{booking.patientName}</p>
                <p className="mt-0.5 font-body text-[11.5px] text-dark/55">
                  Current: {fmtMY(booking.oldStart, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <div className="mt-3">
                  <SlotPicker
                    treatmentId={booking.treatmentId}
                    gender={booking.patientGender}
                    mode={booking.bookingKind}
                    value={selections[booking.id] ?? ''}
                    onChange={(iso) => choose(booking.id, iso)}
                    label={`New time for ${booking.patientName}`}
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-dark/[0.04] p-4 font-body text-[12.5px] text-dark/60">
            The whole group cannot be moved online because at least one guest&apos;s rescheduling window is closed.
          </p>
        )}

        {error && <p role="alert" className="mt-3 font-body text-[12.5px] text-red-700">{error}</p>}
        {success && (
          <p role="status" className="mt-3 font-body text-[12.5px] text-green-700">
            Every active guest has been rescheduled.
          </p>
        )}
        {wholeGroupAvailable && (
          <button
            type="button"
            onClick={submitWholeGroup}
            disabled={!wholeGroupReady || pending}
            className="mt-5 rounded-full bg-primary px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Checking every slot…' : 'Confirm entire group'}
          </button>
        )}
      </section>

      <section>
        <h3 className="font-heading text-[13px] font-bold text-primary">Manage an individual guest</h3>
        <p className="mt-1 font-body text-[12.5px] leading-5 text-dark/60">
          Moving one guest separates that appointment from future group management without changing anyone else.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {members.map((member) => {
            const booking = bookingById.get(member.id)
            return (
              <article key={member.id} className="rounded-2xl bg-cream/40 p-4 ring-1 ring-accent/15">
                <p className="font-heading text-[13px] font-bold text-primary">{member.patientName}</p>
                <p className="mt-1 font-body text-[12px] leading-5 text-dark/55">
                  {member.treatmentName} · {fmtMY(member.selectedTime, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {member.canReschedule && booking ? (
                  <RescheduleBookingForm
                    anchorId={anchorId}
                    bookings={[booking]}
                    action={action}
                  />
                ) : (
                  <p className="mt-4 font-body text-[12px] text-dark/50">
                    This guest&apos;s online rescheduling window is closed.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
