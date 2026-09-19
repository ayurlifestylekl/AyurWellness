import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getAppointmentDetail, getGroupAppointments } from '@/lib/staff/appointments'
import { therapistsForGender } from '@/lib/staff/therapists'
import StatusBadge from '@/components/staff/StatusBadge'
import PatientHealthPanel from '@/components/staff/PatientHealthPanel'
import ClinicalNotes from '@/components/staff/ClinicalNotes'
import UnlockTreatment from '@/components/staff/UnlockTreatment'
import AppointmentActions from '@/components/staff/AppointmentActions'
import GroupApprovalActions from '@/components/staff/GroupApprovalActions'
import MarkContactedButton from '@/components/staff/MarkContactedButton'
import { canClearConsultation } from '@/lib/booking/consultation-rules'

export const dynamic = 'force-dynamic'

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full', timeStyle: 'short' }) : '—'
}

export default async function DoctorPatientPage({ params }: { params: { id: string } }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const [a, therapists] = await Promise.all([getAppointmentDetail(db, params.id), therapistsForGender(null)])
  if (!a) notFound()

  const groupMembers = a.groupId ? await getGroupAppointments(db, a.groupId) : []
  const isGroup = groupMembers.length > 1
  const canShowClearance = a.treatmentUnlocked || canClearConsultation({
    bookingKind: a.bookingKind,
    status: a.status,
    appointmentISO: a.appointmentDatetime,
    nowMs: Date.now(),
  })

  // Doctors see name/gender/health only — never contact details.
  const hideContact = role === 'doctor'
  const subline = [a.treatmentName, fmt(a.appointmentDatetime), hideContact ? null : a.patientPhone]
    .filter(Boolean)
    .join(' · ')

  return (
    <div>
      <Link href="/doctor" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Doctor dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-[22px] font-extrabold text-primary">{a.patientName ?? 'Patient'}</h1>
        <StatusBadge status={a.status} />
        <span className="rounded-full border border-dark/15 px-2 py-0.5 font-heading text-[10px] uppercase tracking-[0.12em] text-dark/50">{a.bookingKind}</span>
      </div>
      <p className="mt-1 font-body text-[13.5px] text-dark/60">{subline}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <PatientHealthPanel p={a} hideContact={hideContact} />
        <div className="space-y-4">
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
              backHref="/doctor"
              canDelete={role === 'admin'}
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
              backHref="/doctor"
              canDelete={role === 'admin'}
              assignedTherapistCode={a.assignedTherapistCode}
              assignedTherapistName={a.assignedTherapistName}
            />
          )}
          {a.bookingKind === 'consultation' && (canShowClearance ? (
            <UnlockTreatment consultationId={a.id} treatmentId={a.treatmentId} unlocked={a.treatmentUnlocked} outcome={a.consultationOutcome ?? null} />
          ) : (
            <div className="rounded-xl border border-accent/30 bg-white p-5">
              <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Treatment clearance</h3>
              <p className="mt-2 font-body text-[13px] text-dark/60">
                Clearance becomes available after this consultation is attended and its appointment time has arrived.
              </p>
            </div>
          ))}
          <ClinicalNotes id={a.id} initial={a.clinicalNotes} />
        </div>
      </div>
    </div>
  )
}
