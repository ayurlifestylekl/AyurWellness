'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingKind, BookingStatus, Gender } from '@/types/booking'
import { getOperationalActionState } from '@/lib/booking/operations'
import { approveAndAssign, assignTherapist, setStatus, rejectBooking, deleteBooking } from '@/lib/staff/actions'
import type { Therapist } from '@/lib/staff/therapist-format'
import { therapistLabel } from '@/lib/staff/therapist-format'
import { fmtMY } from '@/lib/datetime'

interface Props {
  id: string
  status: BookingStatus
  bookingKind: BookingKind
  /** Required therapist gender derived from the gender policy (or null = any). */
  genderRequirement: Gender | null
  /** The guest's preferred time (read-only — staff confirm this or the alternate). */
  requestedAt: string | null
  /** The guest's alternate time, if they gave one. */
  requestedAtAlt?: string | null
  /** Where to send the user after a delete (the list this came from). */
  backHref?: string
  /** Whether to show the destructive Delete button (front desk / admin only). */
  canDelete?: boolean
  /** Current therapist assignment, if any — a confirmed instant booking has none until front desk names one. */
  assignedTherapistCode?: string | null
  assignedTherapistName?: string | null
  /** Active therapists for assignment dropdowns. */
  therapists: Therapist[]
}

export default function AppointmentActions({
  id, status, bookingKind, genderRequirement, requestedAt, requestedAtAlt = null,
  backHref = '/console', canDelete = false, assignedTherapistCode = null, assignedTherapistName = null,
  therapists,
}: Props) {
  const router = useRouter()
  const [therapistCode, setTherapistCode] = useState('')
  const [postTherapistCode, setPostTherapistCode] = useState('')
  const [postRoom, setPostRoom] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignPending, startAssign] = useTransition()
  // Guest can only be confirmed at a time THEY offered — not a free-typed time.
  const timeOptions = [
    { key: 'preferred', label: 'Preferred', iso: requestedAt },
    { key: 'alt', label: 'Alternate', iso: requestedAtAlt },
  ].filter((o): o is { key: string; label: string; iso: string } => !!o.iso)
  const [chosenTime, setChosenTime] = useState(timeOptions[0]?.iso ?? '')
  const [room, setRoom] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ ok: true } | { error: string }>) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  const onApprove = () => {
    if (!chosenTime) { setError('Select the confirmed time.'); return }
    run(() => approveAndAssign(id, { therapistCode, confirmedAt: chosenTime, room }))
  }

  const onConfirmReject = () => {
    run(() => rejectBooking(id, rejectReason))
  }

  const onAssign = () => {
    setAssignError(null)
    if (!postTherapistCode) { setAssignError('Select a therapist.'); return }
    startAssign(async () => {
      const res = await assignTherapist(id, { therapistCode: postTherapistCode, room: postRoom })
      if ('error' in res) setAssignError(res.error)
      else { setPostTherapistCode(''); router.refresh() }
    })
  }

  const onDelete = () => {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return
    setError(null)
    start(async () => {
      const res = await deleteBooking(id)
      if ('error' in res) setError(res.error)
      else router.push(backHref)
    })
  }

  const isConsultation = bookingKind === 'consultation'
  const { blocked: operationalActionBlocked, message: operationalActionMessage } = getOperationalActionState({
    bookingKind,
    assignedTherapistCode,
    status,
  })
  const needsApproval = status === 'pending' || status === 'scheduled'
  const isRequestPhase = status === 'pending' || status === 'scheduled' || status === 'awaiting_payment'
  const canReject = isRequestPhase
  const showDangerZone = canReject || canDelete

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Actions</h3>

      {needsApproval && (
        <div className="space-y-3">
          {isConsultation ? (
            <p className="rounded-lg bg-cream px-3 py-2 font-body text-[12.5px] text-dark/70">
              Free consultation — conducted by the Vaidya. No therapist assignment needed.
            </p>
          ) : (
            <>
              {genderRequirement && (
                <p className="rounded-lg bg-cream px-3 py-2 font-body text-[12.5px] text-dark/70">
                  Same-gender policy: assign a <strong>{genderRequirement}</strong> therapist.
                </p>
              )}
              <Field label="Assign therapist">
                <select value={therapistCode} onChange={(e) => setTherapistCode(e.target.value)} className={inp}>
                  <option value="">Select therapist…</option>
                  {therapists.filter((t) => !genderRequirement || t.gender === genderRequirement).map((t) => (
                    <option key={t.code} value={t.code}>{therapistLabel(t)}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Confirm a time the guest requested">
            {timeOptions.length === 0 ? (
              <p className="font-body text-[12.5px] italic text-dark/55">No time provided.</p>
            ) : (
              <div className="space-y-1.5">
                {timeOptions.map((o) => (
                  <label key={o.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-accent/20 px-3 py-2">
                    <input
                      type="radio"
                      name="confirmTime"
                      checked={chosenTime === o.iso}
                      onChange={() => setChosenTime(o.iso)}
                      className="h-4 w-4 flex-none accent-[#006B3C]"
                    />
                    <span className="font-body text-[13px] text-dark/80">
                      <strong className="font-heading text-[10px] uppercase tracking-[0.12em] text-dark/55">{o.label}:</strong>{' '}
                      {fmtMY(o.iso, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Field>

          <Field label="Room (optional)">
            <input value={room} onChange={(e) => setRoom(e.target.value)} className={inp} placeholder="e.g. Room 2" />
          </Field>
          <button disabled={pending} onClick={onApprove} className={btnPrimary}>
            {pending ? 'Saving…' : bookingKind === 'consultation' ? 'Approve & confirm consultation' : 'Approve & assign'}
          </button>
        </div>
      )}

      {status === 'awaiting_payment' && (
        <p className="font-body text-[13px] text-dark/65">Approved — waiting for the customer to pay. They&apos;ll be confirmed automatically once payment succeeds.</p>
      )}

      {(status === 'confirmed' || status === 'checked_in' || status === 'in_progress') && !isConsultation && (
        <div className="mb-4 space-y-3 rounded-lg bg-cream px-3 py-3">
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
            Therapist{assignedTherapistCode ? '' : ' — not yet assigned'}
          </p>
          {assignedTherapistName && (
            <p className="font-body text-[13px] text-dark/80">
              Currently: <strong>{assignedTherapistName}</strong> · {assignedTherapistCode}
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <select value={postTherapistCode} onChange={(e) => setPostTherapistCode(e.target.value)} className={inp}>
              <option value="">{assignedTherapistCode ? 'Reassign to…' : 'Select therapist…'}</option>
              {therapists.filter((t) => !genderRequirement || t.gender === genderRequirement).map((t) => (
                <option key={t.code} value={t.code}>{therapistLabel(t)}</option>
              ))}
            </select>
            <input value={postRoom} onChange={(e) => setPostRoom(e.target.value)} className={inp} placeholder="Room (optional)" />
            <button disabled={assignPending} onClick={onAssign} className="h-11 flex-none rounded-xl bg-accent px-4 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
              {assignPending ? 'Saving…' : assignedTherapistCode ? 'Reassign' : 'Assign'}
            </button>
          </div>
          {assignError && <p role="alert" className="font-body text-[12.5px] text-red-700">{assignError}</p>}
        </div>
      )}

      {(status === 'confirmed' || status === 'checked_in' || status === 'in_progress') && (
        <div>
          <div className="flex flex-wrap gap-2">
            {status === 'confirmed' && <Btn onClick={() => run(() => setStatus(id, 'checked_in'))} disabled={pending || operationalActionBlocked}>Check in</Btn>}
            {status === 'checked_in' && <Btn onClick={() => run(() => setStatus(id, 'in_progress'))} disabled={pending || operationalActionBlocked}>Start treatment</Btn>}
            {status === 'in_progress' && <Btn onClick={() => run(() => setStatus(id, 'completed'))} disabled={pending}>Complete</Btn>}
            {status !== 'in_progress' && <Btn danger onClick={() => run(() => setStatus(id, 'no_show'))} disabled={pending}>No-show</Btn>}
            <Btn danger onClick={() => run(() => setStatus(id, 'cancelled'))} disabled={pending}>Cancel</Btn>
          </div>
          {operationalActionBlocked && (
            <p className="mt-2 font-body text-[12.5px] font-semibold text-accent">{operationalActionMessage}</p>
          )}
        </div>
      )}

      {/* Reject with a reason the guest will see, so they can re-book. */}
      {rejecting && (
        <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Field label="Reason for rejection (shown to the guest)">
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. No therapist available at that time — please pick another slot."
              className={inp}
            />
          </Field>
          <div className="flex gap-2">
            <Btn danger onClick={onConfirmReject} disabled={pending}>{pending ? 'Rejecting…' : 'Confirm rejection'}</Btn>
            <Btn onClick={() => setRejecting(false)} disabled={pending}>Back</Btn>
          </div>
        </div>
      )}

      {showDangerZone && !rejecting && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-accent/15 pt-4">
          {canReject && <Btn danger onClick={() => setRejecting(true)} disabled={pending}>Reject request</Btn>}
          {canDelete && <Btn danger onClick={onDelete} disabled={pending}>Delete</Btn>}
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{error}</p>}
    </div>
  )
}

const inp = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
const btnPrimary = 'inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent/90 disabled:opacity-60'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">{label}</span>
      {children}
    </label>
  )
}
function Btn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] disabled:opacity-60 ${
        danger ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-accent/40 text-primary hover:bg-cream'
      }`}
    >
      {children}
    </button>
  )
}
