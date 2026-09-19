import type { DoctorPatientView } from '@/types/booking'

/**
 * Read-only patient + health context. Shown on console + doctor detail.
 * `hideContact` drops phone/email for the doctor role — doctors see only name,
 * gender and health history, never contact details (PDPA).
 */
export default function PatientHealthPanel({ p, hideContact = false }: { p: DoctorPatientView; hideContact?: boolean }) {
  const intake = p.healthIntake ?? {}
  const acct = p.accountHealth
  const hasIntake = !!(intake.conditions || intake.allergies || intake.medications || intake.pregnant || intake.onPeriod || intake.notes)
  const hasAcct = !!(acct && (acct.allergies || acct.medications || acct.conditions || acct.heightCm || acct.weightKg))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/30 bg-white p-5">
        <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Guest</h3>
        <div className="space-y-1.5">
          <Row label="Name" value={p.patientName} />
          {!hideContact && <Row label="Contact" value={p.patientPhone} />}
          {!hideContact && <Row label="Email" value={p.patientEmail} />}
          <Row label="Gender" value={p.patientGender} />
          <Row label="Account" value={p.isGuest ? 'Guest' : 'Registered'} />
        </div>
      </div>

      <div className="rounded-xl border border-accent/30 bg-white p-5">
        <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
          Previous health information
        </h3>

        {hasAcct && (
          <div className="mb-4">
            <div className="mb-1.5 font-heading text-[10px] uppercase tracking-[0.14em] text-dark/45">Health profile (account)</div>
            <div className="space-y-1.5">
              <Row label="Conditions" value={acct!.conditions} />
              <Row label="Allergies" value={acct!.allergies} />
              <Row label="Medications" value={acct!.medications} />
              <Row
                label="Height / Weight"
                value={[acct!.heightCm && `${acct!.heightCm} cm`, acct!.weightKg && `${acct!.weightKg} kg`].filter(Boolean).join(' · ') || null}
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 font-heading text-[10px] uppercase tracking-[0.14em] text-dark/45">Booking intake</div>
          {hasIntake ? (
            <div className="space-y-1.5">
              <Row label="Conditions" value={intake.conditions ?? null} />
              <Row label="Allergies" value={intake.allergies ?? null} />
              <Row label="Medications" value={intake.medications ?? null} />
              {intake.pregnant && <Row label="Pregnancy" value="Pregnant / may be pregnant" />}
              {intake.onPeriod && <Row label="Menstruation" value={intake.onPeriod === 'yes' ? 'On period' : 'Not on period'} />}
              <Row label="Notes" value={intake.notes ?? null} />
            </div>
          ) : (
            <p className="font-body text-[13px] italic text-dark/45">No intake provided.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 font-body text-[13.5px]">
      <span className="w-28 flex-none text-dark/45">{label}</span>
      <span className="font-medium text-dark/85">{value || '—'}</span>
    </div>
  )
}
