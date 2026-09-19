'use client'

import { useState, useTransition } from 'react'
import type { BookingKind } from '@/types/booking'
import { getOperationalTransitionOffer } from '@/lib/booking/operations'
import {
  moveAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  markAppointmentNoShow,
} from '@/lib/admin/appointments/actions'
import {
  nextAppointmentStatuses,
  STATUS_LABELS,
  type AppointmentStatus,
} from '@/lib/admin/appointments/status-transitions'

type Mode = 'menu' | 'cancel' | 'reschedule' | 'noshow'

export default function StatusDialog({
  appointmentId,
  currentStatus,
  currentDateTime,
  bookingKind,
  assignedTherapistCode,
}: {
  appointmentId: string
  currentStatus: AppointmentStatus
  currentDateTime: string
  bookingKind: BookingKind
  assignedTherapistCode: string | null
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('menu')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const statusOptions = nextAppointmentStatuses(currentStatus)
  const options = statusOptions.filter((status) => getOperationalTransitionOffer({
    bookingKind,
    assignedTherapistCode,
    to: status,
  }).offered)
  const blockedOffer = statusOptions
    .map((status) => getOperationalTransitionOffer({ bookingKind, assignedTherapistCode, to: status }))
    .find((offer) => !offer.offered)

  // form state
  const [reason, setReason] = useState('')
  const [newDateTime, setNewDateTime] = useState(currentDateTime.slice(0, 16))

  function close() {
    setOpen(false)
    setMode('menu')
    setError(null)
    setReason('')
  }

  function move(to: AppointmentStatus) {
    if (to === 'cancelled') {
      setMode('cancel')
      return
    }
    if (to === 'rescheduled') {
      setMode('reschedule')
      return
    }
    if (to === 'no_show') {
      setMode('noshow')
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await moveAppointmentStatus(appointmentId, to)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  function doCancel() {
    setError(null)
    startTransition(async () => {
      const r = await cancelAppointment(appointmentId, reason)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  function doReschedule() {
    setError(null)
    startTransition(async () => {
      const r = await rescheduleAppointment({
        appointmentId,
        newDateTime: new Date(newDateTime).toISOString(),
        reason,
      })
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  function doNoShow() {
    setError(null)
    startTransition(async () => {
      const r = await markAppointmentNoShow(appointmentId)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  if (options.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C]"
      >
        Change status
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            {mode === 'menu' ? (
              <>
                <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
                  Change status
                </h2>
                <p className="mt-1 text-[12px] text-[#12372D]/65">
                  From <strong>{STATUS_LABELS[currentStatus]}</strong> to:
                </p>
                {blockedOffer ? (
                  <p className="mt-2 text-[12px] font-semibold text-[#B58A3B]">{blockedOffer.message}</p>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  {options.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() => move(s)}
                      className={`rounded-lg border px-3 py-2 text-left text-[13px] hover:bg-[#EDF4E7]/60 disabled:opacity-50 ${
                        s === 'cancelled' || s === 'no_show'
                          ? 'border-red-200 text-red-700'
                          : 'border-[#006B3C]/15 text-[#006B3C]'
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </>
            ) : mode === 'cancel' ? (
              <>
                <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
                  Cancel appointment
                </h2>
                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={pending || reason.trim().length < 3}
                    onClick={doCancel}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    Cancel appointment
                  </button>
                </div>
              </>
            ) : mode === 'reschedule' ? (
              <>
                <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
                  Reschedule
                </h2>
                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  New date & time *
                </label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={pending || reason.trim().length < 3 || !newDateTime}
                    onClick={doReschedule}
                    className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                </div>
              </>
            ) : mode === 'noshow' ? (
              <>
                <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
                  Mark no-show?
                </h2>
                <p className="mt-1 text-[12px] text-[#12372D]/65">
                  Customer didn&apos;t arrive. This is final — advance payment is typically forfeited.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={doNoShow}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    Mark no-show
                  </button>
                </div>
              </>
            ) : null}

            {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={close}
              className="mt-4 text-[12px] text-[#12372D]/55"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
