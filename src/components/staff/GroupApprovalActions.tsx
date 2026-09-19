'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Gender } from '@/types/booking'
import { approveGroup, assignTherapist, rejectGroup, deleteBooking } from '@/lib/staff/actions'
import type { Therapist } from '@/lib/staff/therapist-format'
import { therapistLabel } from '@/lib/staff/therapist-format'
import { fmtMY } from '@/lib/datetime'

export interface GroupGuestRow {
  id: string
  patientName: string | null
  patientGender: Gender | null
  /** Guest age (group bookings capture it per guest). */
  age?: number | null
  /** The therapy this guest chose (guests in a group may differ). */
  treatmentName?: string | null
  /** This guest's own requested slot (guests in a group may pick different times). */
  requestedAt: string | null
  /** This guest's confirmed slot, once approved. */
  appointmentAt: string | null
  /** Same-gender therapist required for this guest (null = any). */
  genderRequirement: Gender | null
  status: string
  assignedTherapistName: string | null
  assignedTherapistCode: string | null
}

interface Props {
  groupId: string
  members: GroupGuestRow[]
  backHref?: string
  canDelete?: boolean
  /** Active therapists for assignment dropdowns. */
  therapists: Therapist[]
}

/** UTC ISO → 'YYYY-MM-DDTHH:mm' in Malaysia time (UTC+8) for a datetime-local input. */
function toMytInput(iso: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? '' : new Date(t + 8 * 3600_000).toISOString().slice(0, 16)
}
/** datetime-local value (Malaysia time) → UTC ISO. */
function fromMytInput(v: string): string {
  return v ? new Date(`${v}:00+08:00`).toISOString() : ''
}

export default function GroupApprovalActions({
  groupId,
  members,
  backHref = '/console',
  canDelete = false,
  therapists,
}: Props) {
  const router = useRouter()
  const pendingMembers = members.filter((m) => m.status === 'pending' || m.status === 'scheduled')
  const needsApproval = pendingMembers.length > 0
  const awaitingPayment = members.some((m) => m.status === 'awaiting_payment')

  // Each guest confirms at THEIR requested time by default; staff may adjust.
  const [times, setTimes] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingMembers.map((m) => [m.id, toMytInput(m.requestedAt)])),
  )
  const [room, setRoom] = useState('')
  const [assign, setAssign] = useState<Record<string, string>>({})
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Post-confirmation therapist assignment — each guest is its own row, so
  // front desk assigns them independently, at their own pace, with no forced
  // all-at-once batch (unlike the pre-payment approval flow above).
  const [postAssign, setPostAssign] = useState<Record<string, string>>({})
  const [postRoom, setPostRoom] = useState<Record<string, string>>({})
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({})
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignPending, startAssign] = useTransition()

  const setTherapist = (id: string, code: string) => setAssign((p) => ({ ...p, [id]: code }))
  const setTime = (id: string, v: string) => setTimes((p) => ({ ...p, [id]: v }))

  const onAssignGuest = (id: string) => {
    setAssignErrors((p) => ({ ...p, [id]: '' }))
    const code = postAssign[id]
    if (!code) { setAssignErrors((p) => ({ ...p, [id]: 'Select a therapist.' })); return }
    setAssigningId(id)
    startAssign(async () => {
      const res = await assignTherapist(id, { therapistCode: code, room: postRoom[id] })
      if ('error' in res) setAssignErrors((p) => ({ ...p, [id]: res.error }))
      else { setPostAssign((p) => ({ ...p, [id]: '' })); router.refresh() }
      setAssigningId(null)
    })
  }

  const run = (fn: () => Promise<{ ok: true } | { error: string }>) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  const onApprove = () => {
    for (const m of pendingMembers) {
      if (!times[m.id]) { setError(`Set the confirmed time for ${m.patientName ?? 'every guest'}.`); return }
      if (!assign[m.id]) { setError('Assign a therapist for every guest.'); return }
    }
    run(() => approveGroup(groupId, {
      room,
      assignments: pendingMembers.map((m) => ({
        id: m.id,
        therapistCode: assign[m.id],
        confirmedAt: fromMytInput(times[m.id]),
      })),
    }))
  }

  const onReject = () => run(() => rejectGroup(groupId, rejectReason))

  const onDelete = () => {
    if (!confirm('Permanently delete EVERY guest in this group? This cannot be undone.')) return
    setError(null)
    start(async () => {
      for (const m of members) {
        const res = await deleteBooking(m.id)
        if ('error' in res) { setError(res.error); return }
      }
      router.push(backHref)
    })
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-1 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
        Group · {members.length} guests
      </h3>
      <p className="mb-3 font-body text-[12px] text-dark/55">
        Each guest has their own time. Confirm the time and assign a same-gender therapist per guest, then approve the whole group.
        The same therapist can take two guests when their sessions don’t overlap.
      </p>

      {needsApproval && (
        <div className="space-y-3">
          <Field label="Confirm time & therapist per guest">
            <div className="space-y-2">
              {pendingMembers.map((m) => (
                <div key={m.id} className="space-y-1.5 rounded-lg border border-accent/20 px-3 py-2">
                  <div>
                    <div className="font-body text-[13px] font-semibold text-primary">{m.patientName ?? 'Guest'}</div>
                    <div className="font-body text-[11.5px] text-dark/55">{guestMeta(m)}</div>
                    {m.requestedAt && (
                      <div className="font-body text-[11.5px] text-dark/55">
                        Requested: {fmtMY(m.requestedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={times[m.id] ?? ''}
                    onChange={(e) => setTime(m.id, e.target.value)}
                    className={inp}
                    aria-label={`Confirmed time for ${m.patientName ?? 'guest'} (Malaysia time)`}
                  />
                  <select value={assign[m.id] ?? ''} onChange={(e) => setTherapist(m.id, e.target.value)} className={inp}>
                    <option value="">Select therapist…</option>
                    {therapists.filter((t) => !m.genderRequirement || t.gender === m.genderRequirement).map((t) => (
                      <option key={t.code} value={t.code}>{therapistLabel(t)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Room (optional)">
            <input value={room} onChange={(e) => setRoom(e.target.value)} className={inp} placeholder="e.g. Room 2" />
          </Field>

          <button disabled={pending} onClick={onApprove} className={btnPrimary}>
            {pending ? 'Saving…' : `Approve group (${pendingMembers.length})`}
          </button>
        </div>
      )}

      {!needsApproval && (
        <div className="space-y-2">
          {awaitingPayment && (
            <p className="font-body text-[13px] text-dark/65">
              Approved — waiting for the customer to pay. One payment confirms the whole group.
            </p>
          )}
          {members.map((m) => {
            const canAssign = ['confirmed', 'checked_in', 'in_progress'].includes(m.status)
            return (
              <div key={m.id} className="rounded-lg border border-accent/15 px-3 py-2 font-body text-[12.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="font-semibold text-primary">{m.patientName ?? 'Guest'}</span>
                    <span className="block text-[11px] text-dark/55">{guestMeta(m)}</span>
                    {m.appointmentAt && (
                      <span className="block text-[11px] text-dark/70">{fmtMY(m.appointmentAt, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    )}
                  </span>
                  {!canAssign && (
                    <span className="flex-none text-right text-dark/60">{m.assignedTherapistName ? `${m.assignedTherapistName} · ${m.assignedTherapistCode}` : '—'}</span>
                  )}
                </div>
                {canAssign && (
                  <div className="mt-2 space-y-1.5">
                    {m.assignedTherapistName && (
                      <p className="text-[11.5px] text-dark/70">Currently: <strong>{m.assignedTherapistName}</strong> · {m.assignedTherapistCode}</p>
                    )}
                    <div className="flex flex-wrap items-end gap-1.5">
                      <select
                        value={postAssign[m.id] ?? ''}
                        onChange={(e) => setPostAssign((p) => ({ ...p, [m.id]: e.target.value }))}
                        className={inp}
                      >
                        <option value="">{m.assignedTherapistCode ? 'Reassign to…' : 'Select therapist…'}</option>
                        {therapists.filter((t) => !m.genderRequirement || t.gender === m.genderRequirement).map((t) => (
                          <option key={t.code} value={t.code}>{therapistLabel(t)}</option>
                        ))}
                      </select>
                      <input
                        value={postRoom[m.id] ?? ''}
                        onChange={(e) => setPostRoom((p) => ({ ...p, [m.id]: e.target.value }))}
                        className={inp}
                        placeholder="Room (optional)"
                      />
                      <button
                        disabled={assignPending && assigningId === m.id}
                        onClick={() => onAssignGuest(m.id)}
                        className="h-9 flex-none rounded-lg bg-accent px-3 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-60"
                      >
                        {assignPending && assigningId === m.id ? 'Saving…' : m.assignedTherapistCode ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                    {assignErrors[m.id] && <p role="alert" className="text-[11.5px] text-red-700">{assignErrors[m.id]}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reject the whole group with a reason the guest will see. */}
      {rejecting && (
        <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Field label="Reason for rejection (shown to the guest)">
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Not enough therapists available at that time — please pick another slot."
              className={inp}
            />
          </Field>
          <div className="flex gap-2">
            <Btn danger onClick={onReject} disabled={pending}>{pending ? 'Rejecting…' : 'Confirm rejection'}</Btn>
            <Btn onClick={() => setRejecting(false)} disabled={pending}>Back</Btn>
          </div>
        </div>
      )}

      {!rejecting && (needsApproval || awaitingPayment || canDelete) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-accent/15 pt-4">
          {(needsApproval || awaitingPayment) && <Btn danger onClick={() => setRejecting(true)} disabled={pending}>Reject group</Btn>}
          {canDelete && <Btn danger onClick={onDelete} disabled={pending}>Delete group</Btn>}
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{error}</p>}
    </div>
  )
}

/** "34 yrs · female · Ayurveda Face Massage" — omits any missing parts. */
function guestMeta(m: GroupGuestRow): string {
  const gender = m.patientGender ?? m.genderRequirement ?? null
  return [m.age != null ? `${m.age} yrs` : null, gender, m.treatmentName ?? null]
    .filter(Boolean)
    .join(' · ')
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
