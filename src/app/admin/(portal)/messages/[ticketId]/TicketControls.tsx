'use client'

import { useTransition } from 'react'
import {
  setTicketStatus,
  setTicketTopic,
  assignTicketToMe,
  clearTicketAssignment,
  setTicketReadByClinic,
} from '@/lib/admin/messages/actions'

type Status = 'open' | 'awaiting-customer' | 'resolved' | 'closed'
type Topic = 'treatment' | 'prescription' | 'appointment' | 'order' | 'billing' | 'welcome' | 'other'

export default function TicketControls({
  ticketId,
  status,
  topic,
  assignedToAdminId,
  currentAdminId,
  assigneeName,
  unreadByClinic,
}: {
  ticketId: string
  status: Status
  topic: Topic
  assignedToAdminId: string | null
  currentAdminId: string
  assigneeName: string | null
  unreadByClinic: boolean
}) {
  const [pending, startTransition] = useTransition()

  function changeStatus(to: Status) {
    startTransition(async () => {
      await setTicketStatus(ticketId, to)
      location.reload()
    })
  }
  function changeTopic(to: Topic) {
    startTransition(async () => {
      await setTicketTopic(ticketId, to)
    })
  }
  function toggleAssignment() {
    startTransition(async () => {
      if (assignedToAdminId) await clearTicketAssignment(ticketId)
      else await assignTicketToMe(ticketId)
      location.reload()
    })
  }
  function toggleRead() {
    startTransition(async () => {
      await setTicketReadByClinic(ticketId, unreadByClinic)
      location.reload()
    })
  }

  const isMine = assignedToAdminId === currentAdminId

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Controls</h3>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value as Status)}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        >
          <option value="open">Open</option>
          <option value="awaiting-customer">Awaiting customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Topic
        </label>
        <select
          value={topic}
          onChange={(e) => changeTopic(e.target.value as Topic)}
          disabled={pending}
          className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        >
          <option value="treatment">Treatment</option>
          <option value="prescription">Prescription</option>
          <option value="appointment">Appointment</option>
          <option value="order">Order</option>
          <option value="billing">Billing</option>
          <option value="welcome">Welcome</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="border-t border-[#006B3C]/6 pt-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Assignment
        </label>
        <p className="mt-1 text-[12px] text-[#12372D]/65">
          {assignedToAdminId
            ? isMine
              ? '👤 Assigned to you'
              : `👤 Assigned to ${assigneeName ?? 'another staff'}`
            : 'Unassigned'}
        </p>
        <button
          type="button"
          onClick={toggleAssignment}
          disabled={pending}
          className="mt-2 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] disabled:opacity-50"
        >
          {assignedToAdminId ? 'Clear assignment' : 'Assign to me'}
        </button>
      </div>

      <div className="border-t border-[#006B3C]/6 pt-3">
        <button
          type="button"
          onClick={toggleRead}
          disabled={pending}
          className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] disabled:opacity-50"
        >
          Mark as {unreadByClinic ? 'read' : 'unread'}
        </button>
      </div>
    </div>
  )
}
