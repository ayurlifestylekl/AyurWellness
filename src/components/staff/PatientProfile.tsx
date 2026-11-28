import Link from 'next/link'
import { currentAge } from '@/lib/staff/case-sheets'
import { MessageCircle, Phone, CalendarPlus, Pencil, UserPlus } from 'lucide-react'
import PatientHealthPanel from '@/components/staff/PatientHealthPanel'
import PatientVisitHistory from '@/components/staff/PatientVisitHistory'
import { customerWaLink } from '@/lib/booking/contact'
import { CLINIC_NAME } from '@/lib/clinic'
import type { DoctorPatientView } from '@/types/booking'
import type { PatientRecord, PatientVisit } from '@/lib/staff/patients'
import type { CaseSheet } from '@/lib/staff/patient-files'
import { formatPatientNo } from '@/lib/staff/patient-id'
import { mytDayKey } from '@/lib/datetime'
import CaseSheetList from '@/components/staff/CaseSheetList'
import PatientPhotos, { type PhotoItem } from '@/components/staff/PatientPhotos'
import BillsList from '@/components/staff/BillsList'
import BalancesPanel from '@/components/staff/BalancesPanel'
import type { PatientBalances } from '@/lib/counter/queries'
import StartBillButton from '@/components/staff/StartBillButton'
import type { Bill } from '@/lib/counter/queries'

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : null
}

const ATTENDED = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed']
const UPCOMING = ['confirmed', 'scheduled', 'awaiting_payment', 'pending']

function age(r: { dateOfBirth: string | null; ageYears: number | null; ageRecordedOn: string | null } | null): string | null {
  if (!r) return null
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  const years = currentAge(r.dateOfBirth, today, { ageYears: r.ageYears, recordedOn: r.ageRecordedOn })
  return years == null ? null : `${years} yrs`
}

/**
 * One patient: contact, their saved record and/or the health details from
 * their latest booking, and every visit. `patient` is the latest booking (null
 * for a hand-added patient who hasn't booked yet).
 */
export default function PatientProfile({
  patient,
  record,
  visits,
  backHref,
  visitLinkBase,
  hideContact,
  showClinical,
  newBookingHref,
  editHref,
  caseSheets,
  photos,
  canDeletePhotos = false,
  bills,
  balances,
}: {
  patient: DoctorPatientView | null
  record: PatientRecord | null
  visits: PatientVisit[]
  backHref: string
  visitLinkBase: string
  hideContact: boolean
  showClinical: boolean
  newBookingHref?: string
  /** Edit the saved record, or save one for a booking-only patient (front desk + admin). */
  editHref?: string
  /** Shown to Vaidyas and admin only (clinical). Omit to hide the section. */
  caseSheets?: CaseSheet[]
  /** Photo attachments; omit to hide the section. Needs a saved record. */
  photos?: PhotoItem[]
  canDeletePhotos?: boolean
  /** Counter bills (front desk + admin); omit to hide. A saved record can start a new bill. */
  bills?: Bill[]
  /** Credit, deposit, gift card, points and outstanding (front desk + admin, saved patients). */
  balances?: PatientBalances | null
}) {
  // The saved record is what staff typed in on purpose, so it wins over booking details.
  const name = record?.fullName ?? patient?.patientName ?? 'Patient'
  const phone = record?.phone ?? patient?.patientPhone ?? null
  const gender = record?.gender ?? patient?.patientGender ?? null
  const nowISO = new Date().toISOString()
  const attended = visits.filter((v) => ATTENDED.includes(v.status) && (v.whenISO ?? '') <= nowISO)
  const next = visits
    .filter((v) => UPCOMING.includes(v.status) && (v.whenISO ?? '') > nowISO)
    .sort((a, b) => (a.whenISO ?? '').localeCompare(b.whenISO ?? ''))[0]
  const wa = hideContact ? null : customerWaLink(phone, `Hi ${name}, this is ${CLINIC_NAME}.`)

  return (
    <div>
      <Link href={backHref} className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Patients
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 font-heading text-[24px] font-extrabold text-primary">
            {name}
            {formatPatientNo(record?.patientNo) && (
              <span className="rounded-full border border-accent/30 bg-cream px-3 py-0.5 font-heading text-[11px] font-bold tracking-[0.1em] text-accent">
                {formatPatientNo(record?.patientNo)}
              </span>
            )}
          </h1>
          <p className="mt-1 font-body text-[13.5px] text-dark/60">
            {[
              gender ? (gender === 'male' ? 'Male' : 'Female') : null,
              age(record ?? null),
              patient?.customerId ? 'Has an account' : record ? 'Saved patient' : 'Guest',
              `${attended.length} visit${attended.length === 1 ? '' : 's'}`,
              attended[0] ? `last ${fmtDate(attended[0].whenISO)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {next && (
            <p className="mt-1 font-body text-[13.5px] font-semibold text-emerald-700">
              Next: {fmtDate(next.whenISO)} — {next.bookingKind === 'consultation' ? 'Consultation' : next.treatmentName ?? 'Treatment'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#25D366] px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#128C4A] hover:bg-[#25D366]/10">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {!hideContact && phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-accent/30 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
          {editHref && (
            <Link href={editHref} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-accent/30 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
              {record ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {record ? 'Edit details' : 'Save details'}
            </Link>
          )}
          {newBookingHref && (
            <Link href={newBookingHref} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90">
              <CalendarPlus className="h-4 w-4" /> New booking
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <PatientVisitHistory visits={visits} currentId="" patientName={name} linkBase={visitLinkBase} showClinical={showClinical} />
          {(caseSheets || photos) && !record && (
            <p className="rounded-xl border border-dashed border-accent/40 bg-cream/40 px-4 py-3 font-body text-[13px] text-dark/65">
              {editHref ? (
                <>
                  <Link href={editHref} className="font-semibold text-accent underline">Save this patient’s details</Link> to give them a patient ID and start case sheets and photos.
                </>
              ) : (
                'Front desk can save this patient’s details to give them a patient ID and start case sheets and photos.'
              )}
            </p>
          )}
          {caseSheets && record && <CaseSheetList patientId={record.id} sheets={caseSheets} />}
          {balances && balances.ready && record && <BalancesPanel patientId={record.id} totals={balances.totals} entries={balances.entries} />}
          {bills && (
            <BillsList bills={bills} base={visitLinkBase === '/doctor' ? '/doctor' : '/console'} action={record ? <StartBillButton patientId={record.id} /> : undefined} />
          )}
          {photos && record && <PatientPhotos patientId={record.id} photos={photos} today={mytDayKey(new Date())} canDelete={canDeletePhotos} />}
        </div>
        <div className="space-y-4">
          {record && <RecordPanel record={record} hideContact={hideContact} />}
          {patient && (
            <div className="space-y-2">
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/45">Details from the latest booking</p>
              <PatientHealthPanel p={patient} hideContact={hideContact} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecordPanel({ record, hideContact }: { record: PatientRecord; hideContact: boolean }) {
  const rows: [string, string | null][] = [
    ...(hideContact
      ? []
      : ([
          ['Phone', record.phone],
          ['Email', record.email],
          ['Address', record.address],
        ] as [string, string | null][])),
    ['Date of birth', record.dateOfBirth ? new Date(`${record.dateOfBirth}T00:00:00+08:00`).toLocaleDateString('en-MY', { dateStyle: 'medium', timeZone: 'Asia/Kuala_Lumpur' }) : null],
    ['Age', age(record)],
    ['Conditions', record.conditions],
    ['Allergies', record.allergies],
    ['Medications', record.medications],
    ['Notes', record.notes],
  ]
  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Saved patient details</h3>
      <dl className="mt-3 space-y-1.5 font-body text-[13px]">
        {rows.map(([k, val]) => (
          <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
            <dt className="text-dark/50">{k}</dt>
            <dd className="whitespace-pre-wrap break-words text-dark/85">{val || '—'}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-body text-[11px] text-dark/40">
        Updated {new Date(record.updatedAt).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium' })}
      </p>
    </div>
  )
}
