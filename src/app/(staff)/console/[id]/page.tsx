import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getAppointmentDetail, getGroupAppointments, getBookingEvents, getRefundsForAppointment } from '@/lib/staff/appointments'
import { therapistsForGender } from '@/lib/staff/therapists'
import StatusBadge from '@/components/staff/StatusBadge'
import PatientHealthPanel from '@/components/staff/PatientHealthPanel'
import AppointmentActions from '@/components/staff/AppointmentActions'
import GroupApprovalActions from '@/components/staff/GroupApprovalActions'
import MarkContactedButton from '@/components/staff/MarkContactedButton'
import BookingEventHistory from '@/components/staff/BookingEventHistory'
import RefundRequestPanel from '@/components/staff/RefundRequestPanel'
import { bookingRef } from '@/lib/booking/ref'
import { reconcilePendingRefundsSafe, bookingRefundDependencies } from '@/lib/payments/refund'

export const dynamic = 'force-dynamic'

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full', timeStyle: 'short' }) : '—'
}

export default async function ConsoleDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const [a, therapists] = await Promise.all([getAppointmentDetail(db, params.id), therapistsForGender(null)])
  if (!a) notFound()

  const groupMembers = a.groupId ? await getGroupAppointments(db, a.groupId) : []
  const isGroup = groupMembers.length > 1

  const events = await getBookingEvents(db, a.id)
  // Resolve any refund HitPay reported as still 'pending' before rendering,
  // so staff see current status without waiting for the reconciliation cron.
  await reconcilePendingRefundsSafe(bookingRefundDependencies())
  const refunds = await getRefundsForAppointment(db, a.id)

  return (
    <div>
      <Link href="/console" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Console
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-[22px] font-extrabold text-primary">{a.treatmentName ?? 'Appointment'}</h1>
        <StatusBadge status={a.status} />
        <span className="rounded-full border border-dark/15 px-2 py-0.5 font-heading text-[10px] uppercase tracking-[0.12em] text-dark/50">{a.bookingKind}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-accent/30 bg-white p-5">
            <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Appointment</h3>
            <div className="space-y-1.5 font-body text-[13.5px]">
              <Row label="Booking ref" value={`#${bookingRef(a.id)}`} />
              <Row label="Web request received" value={fmt(a.requestReceivedAt)} />
              <Row label="Preferred" value={fmt(a.requestedDatetime)} />
              {a.requestedDatetimeAlt && <Row label="Alternate" value={fmt(a.requestedDatetimeAlt)} />}
              <Row label="Confirmed" value={a.appointmentDatetime && a.status !== 'pending' ? fmt(a.appointmentDatetime) : 'Not set'} />
              {a.approvedAt && <Row label="Approved at" value={fmt(a.approvedAt)} />}
              <Row label="Therapist" value={a.assignedTherapistName ? `${a.assignedTherapistName} · ${a.assignedTherapistCode} (${a.assignedTherapistGender})` : '—'} />
              <Row label="Room" value={a.room} />
              <Row label="Price" value={a.payableAmountRm != null ? `RM${a.payableAmountRm}` : a.bookingKind === 'consultation' ? 'Free' : '—'} />
              <Row label="Payment" value={a.paymentStatus} />
            </div>
          </div>
          {refunds.length > 0 && <RefundRequestPanel refunds={refunds} canApprove />}
          <PatientHealthPanel p={a} />
          <BookingEventHistory events={events} />
        </div>

        <div className="space-y-3">
          {['pending', 'scheduled'].includes(a.status) && (
            <MarkContactedButton id={a.id} contactedAt={a.contactedAt} />
          )}
          {isGroup ? (
            <GroupApprovalActions
              groupId={a.groupId as string}
              therapists={therapists}
              members={groupMembers.map((m) => ({
                id: m.id,
                patientName: m.patientName,
                patientGender: m.patientGender,
                age: m.guestAge,
                treatmentName: m.treatmentName,
                requestedAt: m.requestedDatetime,
                appointmentAt: m.appointmentDatetime,
                genderRequirement: m.genderRequirement,
                status: m.status,
                assignedTherapistName: m.assignedTherapistName,
                assignedTherapistCode: m.assignedTherapistCode,
              }))}
              backHref="/console"
              canDelete
            />
          ) : (
            <AppointmentActions
              id={a.id}
              status={a.status}
              bookingKind={a.bookingKind}
              therapists={therapists}
              genderRequirement={a.genderRequirement}
              requestedAt={a.requestedDatetime}
              requestedAtAlt={a.requestedDatetimeAlt}
              backHref="/console"
              canDelete
              assignedTherapistCode={a.assignedTherapistCode}
              assignedTherapistName={a.assignedTherapistName}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 flex-none text-dark/45">{label}</span>
      <span className="font-medium text-dark/85">{value || '—'}</span>
    </div>
  )
}
