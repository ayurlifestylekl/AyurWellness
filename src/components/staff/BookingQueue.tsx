import Link from 'next/link'
import type { StaffAppointment } from '@/types/booking'
import StatusBadge from './StatusBadge'
import { customerWaLink } from '@/lib/booking/contact'

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

type QueueRow =
  | { kind: 'single'; a: StaffAppointment }
  | { kind: 'group'; groupId: string; members: StaffAppointment[] }

/** Fold all rows sharing a group_id into one entry, at the group's first position. */
function collapseGroups(appointments: StaffAppointment[]): QueueRow[] {
  const seen = new Set<string>()
  const rows: QueueRow[] = []
  for (const a of appointments) {
    if (a.groupId) {
      if (seen.has(a.groupId)) continue
      seen.add(a.groupId)
      const members = appointments.filter((x) => x.groupId === a.groupId)
      if (members.length > 1) {
        rows.push({ kind: 'group', groupId: a.groupId, members })
        continue
      }
    }
    rows.push({ kind: 'single', a })
  }
  return rows
}

function genderSummary(members: StaffAppointment[]): string {
  const m = members.filter((x) => x.patientGender === 'male').length
  const f = members.filter((x) => x.patientGender === 'female').length
  return [m ? `${m}M` : '', f ? `${f}F` : ''].filter(Boolean).join(' · ') || 'any'
}

function sumPrice(members: StaffAppointment[]): number | null {
  const total = members.reduce((s, x) => s + (x.payableAmountRm ?? 0), 0)
  return total > 0 ? total : null
}

export default function BookingQueue({
  appointments,
  linkBase = '/console',
  emptyLabel = 'No bookings here.',
}: {
  appointments: StaffAppointment[]
  linkBase?: string
  emptyLabel?: string
}) {
  if (appointments.length === 0) {
    return <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">{emptyLabel}</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-accent/20 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-accent/20 font-heading text-[10px] uppercase tracking-[0.12em] text-dark/45">
          <tr>
            <th className="px-4 py-3">Guest</th>
            <th className="px-4 py-3">Treatment</th>
            <th className="px-4 py-3">Requested</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-accent/10">
          {collapseGroups(appointments).map((row) =>
            row.kind === 'group' ? (
              <GroupRow key={`g-${row.groupId}`} members={row.members} linkBase={linkBase} />
            ) : (
              <SingleRow key={row.a.id} a={row.a} linkBase={linkBase} />
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

function SingleRow({ a, linkBase }: { a: StaffAppointment; linkBase: string }) {
  return (
    <tr className="hover:bg-cream/60">
      <td className="px-4 py-3">
        <div className="font-semibold text-primary">{a.patientName ?? '—'}</div>
        <div className="flex items-center gap-2 text-[12px] text-dark/55">
          <span>{a.patientPhone ?? ''}{a.isGuest ? ' · guest' : ''}</span>
          {customerWaLink(a.patientPhone) && (
            <a href={customerWaLink(a.patientPhone) as string} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:text-green-700">
              WhatsApp
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-dark/85">{a.treatmentName ?? '—'}</div>
        <div className="text-[11px] uppercase tracking-wide text-dark/40">{a.bookingKind}</div>
      </td>
      <td className="px-4 py-3 text-dark/70">{fmt(a.requestedDatetime)}</td>
      <td className="px-4 py-3 text-dark/70">{a.genderRequirement ?? 'any'}</td>
      <td className="px-4 py-3"><StatusCell a={a} /></td>
      <td className="px-4 py-3 text-right font-semibold text-dark">{a.payableAmountRm != null ? `RM${a.payableAmountRm}` : '—'}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`${linkBase}/${a.id}`} className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:text-primary">
          View →
        </Link>
      </td>
    </tr>
  )
}

/** Status badge plus the action context staff asked for: when it was approved,
 *  and whether the centre has already contacted a pending request. */
function StatusCell({ a }: { a: StaffAppointment }) {
  return (
    <div className="space-y-1">
      <StatusBadge status={a.status} />
      {a.status === 'pending' && a.contactedAt && (
        <div className="text-[10.5px] font-semibold text-green-700">Contacted · {fmt(a.contactedAt)}</div>
      )}
      {a.approvedAt && ['awaiting_payment', 'confirmed', 'checked_in', 'in_progress', 'completed'].includes(a.status) && (
        <div className="text-[10.5px] text-dark/45">approved {fmt(a.approvedAt)}</div>
      )}
    </div>
  )
}

/** One collapsed row representing a whole group booking — opens on the lead guest. */
function GroupRow({ members, linkBase }: { members: StaffAppointment[]; linkBase: string }) {
  const lead = members[0]
  const names = members.map((m) => m.patientName).filter(Boolean).join(', ')
  return (
    <tr className="bg-accent/[0.03] hover:bg-cream/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <span>{lead.patientName ?? 'Group'}</span>
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">Group of {members.length}</span>
        </div>
        <div className="truncate text-[12px] text-dark/55" title={names}>{names}</div>
        <div className="flex items-center gap-2 text-[12px] text-dark/55">
          <span>{lead.patientPhone ?? ''}{lead.isGuest ? ' · guest' : ''}</span>
          {customerWaLink(lead.patientPhone) && (
            <a href={customerWaLink(lead.patientPhone) as string} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:text-green-700">
              WhatsApp
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-dark/85">{lead.treatmentName ?? '—'}</div>
        <div className="text-[11px] uppercase tracking-wide text-dark/40">{lead.bookingKind}</div>
      </td>
      <td className="px-4 py-3 text-dark/70">{fmt(lead.requestedDatetime)}</td>
      <td className="px-4 py-3 text-dark/70">{genderSummary(members)}</td>
      <td className="px-4 py-3"><StatusCell a={lead} /></td>
      <td className="px-4 py-3 text-right font-semibold text-dark">{sumPrice(members) != null ? `RM${sumPrice(members)}` : '—'}</td>
      <td className="px-4 py-3 text-right">
        <Link href={`${linkBase}/${lead.id}`} className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:text-primary">
          View →
        </Link>
      </td>
    </tr>
  )
}
