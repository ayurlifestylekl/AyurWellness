'use client'

import type { Gender, HealthIntake } from '@/types/booking'
import { whatsappLink } from '@/lib/clinic'

interface HealthIntakeFieldsProps {
  value: HealthIntake
  onChange: (v: HealthIntake) => void
  gender: Gender | ''
  /** Render just the fields (no section chrome) — for embedding in a guest card. */
  embedded?: boolean
  /** Unique radio-group name when several intakes render on one page (one per guest). */
  radioGroup?: string
  /** Treatment-level flags that control which extra tick boxes appear. */
  requiresScalpDisclaimer?: boolean
  requiresHealthIntake?: boolean
  specialTags?: string[]
}

/** Brief pre-visit health intake. Always shown so the Vaidya always has context. */
export default function HealthIntakeFields({
  value,
  onChange,
  gender,
  embedded = false,
  radioGroup = 'onPeriod',
  requiresScalpDisclaimer = false,
  requiresHealthIntake = false,
  specialTags = [],
}: HealthIntakeFieldsProps) {
  const set = (patch: Partial<HealthIntake>) => onChange({ ...value, ...patch })
  const isOldAge = specialTags.includes('oldage')
  const isKids = specialTags.includes('kids')

  const fields = (
    <div className="grid gap-3">
      <Field label="Existing conditions">
        <textarea
          rows={2}
          value={value.conditions ?? ''}
          onChange={(e) => set({ conditions: e.target.value })}
          placeholder="e.g. high blood pressure, diabetes, recent surgery"
          className={inputCls}
        />
      </Field>
      <Field label="Allergies">
        <input
          value={value.allergies ?? ''}
          onChange={(e) => set({ allergies: e.target.value })}
          placeholder="e.g. nuts, dairy, specific herbs"
          className={inputCls}
        />
      </Field>
      <Field label="Current medications">
        <input
          value={value.medications ?? ''}
          onChange={(e) => set({ medications: e.target.value })}
          placeholder="e.g. blood thinners, supplements"
          className={inputCls}
        />
      </Field>

      {/* Treatment-specific safety disclaimers */}
      {requiresScalpDisclaimer && (
        <Disclaimer
          label="I confirm I do not have dandruff or scalp issues"
          checked={value.noDandruffScalpIssues ?? false}
          onChange={(checked) => set({ noDandruffScalpIssues: checked })}
          warnText="If you have dandruff or scalp issues, please WhatsApp us before booking this therapy."
        />
      )}
      {requiresHealthIntake && isOldAge && (
        <Disclaimer
          label="I confirm I have no recent surgery, open wounds or skin lesions"
          checked={value.noSurgeryWoundSkinLesions ?? false}
          onChange={(checked) => set({ noSurgeryWoundSkinLesions: checked })}
          warnText="If you have any of these, please WhatsApp us so a Vaidya can advise the safest option."
        />
      )}
      {requiresHealthIntake && isKids && (
        <Disclaimer
          label="I confirm the child does not have fever, cold or flu"
          checked={value.noFeverColdFlu ?? false}
          onChange={(checked) => set({ noFeverColdFlu: checked })}
          warnText="If the child has fever, cold or flu, please WhatsApp us before booking."
        />
      )}

      {gender === 'female' && (
        <>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={value.pregnant ?? false}
              onChange={(e) => set({ pregnant: e.target.checked })}
              className="h-4 w-4 accent-[#149447]"
            />
            <span className="font-body text-[13px] text-dark/80">
              {embedded ? 'Pregnant or may be pregnant' : 'I am pregnant or may be pregnant'}
            </span>
          </label>
          <div>
            <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
              Menstruation
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={radioGroup}
                  checked={value.onPeriod === 'yes'}
                  onChange={() => set({ onPeriod: 'yes' })}
                  className="h-4 w-4 accent-[#149447]"
                />
                <span className="font-body text-[13px] text-dark/80">{embedded ? 'On period' : 'I am on my period'}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={radioGroup}
                  checked={value.onPeriod === 'no'}
                  onChange={() => set({ onPeriod: 'no' })}
                  className="h-4 w-4 accent-[#149447]"
                />
                <span className="font-body text-[13px] text-dark/80">{embedded ? 'Not on period' : 'I am not on my period'}</span>
              </label>
            </div>
          </div>
        </>
      )}
      <Field label="Anything else we should know">
        <textarea
          rows={2}
          value={value.notes ?? ''}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Concerns, goals, or areas to focus on"
          className={inputCls}
        />
      </Field>
    </div>
  )

  if (embedded) return fields

  return (
    <fieldset className="rounded-xl border border-accent/25 bg-white/60 p-5">
      <legend className="px-1 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
        Health intake
      </legend>
      <p className="mb-3 font-body text-[12px] italic text-dark/55">
        So our Vaidya can tailor and safely plan your therapy. Leave blank if not applicable.
      </p>
      {fields}
    </fieldset>
  )
}

const inputCls =
  'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark placeholder:text-dark/35 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
        {label}
      </span>
      {children}
    </label>
  )
}

function Disclaimer({
  label,
  checked,
  onChange,
  warnText,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  warnText: string
}) {
  return (
    <div className="grid gap-1">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#149447]"
        />
        <span className="font-body text-[13px] text-dark/80">{label}</span>
      </label>
      <p className="pl-6 font-body text-[12px] text-dark/55">
        {warnText}{' '}
        <a
          href={whatsappLink(`Hi, I'd like to check if a therapy is safe for my current condition.` )}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          WhatsApp us
        </a>
        .
      </p>
    </div>
  )
}
