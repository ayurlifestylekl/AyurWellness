/**
 * The doctors' two case sheets, as fields. Mirrors their paper model
 * ("AYURVEDA PRIMARY CASE SHEET" and "FOLLOW UP SHEET") so the editor, the
 * printable view and validation all read from one definition.
 * Shared by server and client — no server-only imports here.
 */

export type CaseSheetKind = 'primary' | 'follow_up'

export interface PrescriptionRow {
  medicine: string
  dose: string
  duration: string
}

export type TextField = { key: string; label: string; rows?: number; hint?: string }
export type Section =
  | { kind: 'text'; title: string; fields: TextField[] }
  | { kind: 'pariksha'; title: string; fields: TextField[] }
  | { kind: 'prescription'; title: string; key: string; rows: number }

export const PARIKSHA_FIELDS: TextField[] = [
  { key: 'nadi', label: 'Nadi (Pulse)' },
  { key: 'mala', label: 'Mala (Stool)' },
  { key: 'mutra', label: 'Mutra (Urine)' },
  { key: 'jihwa', label: 'Jihwa (Tongue)' },
  { key: 'shabda', label: 'Shabda (Voice/Speech)' },
  { key: 'sparsha', label: 'Sparsha (Skin/Touch)' },
  { key: 'drik', label: 'Drik (Eyes/Vision)' },
  { key: 'akriti', label: 'Akriti (Built/Gait)' },
  { key: 'prakriti', label: 'Prakriti (V/P/K)' },
  { key: 'agni', label: 'Agni / Koshtha' },
]

export const SHEETS: Record<CaseSheetKind, { title: string; short: string; sections: Section[] }> = {
  primary: {
    title: 'Ayurveda Primary Case Sheet',
    short: 'Primary case sheet',
    sections: [
      { kind: 'text', title: '1. Chief complaints & present illness (Laksana & Anubandha)', fields: [{ key: 'chiefComplaints', label: 'Chief complaints & present illness', rows: 5 }] },
      {
        kind: 'text',
        title: '2. Medical & family history',
        fields: [
          { key: 'medicalHistory', label: 'Previous medical / surgical history', rows: 4 },
          { key: 'familyHistory', label: 'Family history & hereditary factors', rows: 4 },
        ],
      },
      {
        kind: 'text',
        title: '3. Current medication & investigations',
        fields: [
          { key: 'currentMedications', label: 'Current medications & supplements', rows: 4 },
          { key: 'investigations', label: 'Current & previous diagnostic investigations', rows: 4 },
        ],
      },
      { kind: 'pariksha', title: '4. Ashtavidha & Dashavidha Pariksha (Ayurvedic examination)', fields: PARIKSHA_FIELDS },
      { kind: 'text', title: '5. Nidana Panchaka & diagnosis', fields: [{ key: 'diagnosis', label: 'Nidana Panchaka & diagnosis', rows: 4 }] },
      { kind: 'prescription', title: '6. Chikitsa plan & prescription (herbs & formulations)', key: 'prescriptions', rows: 6 },
      { kind: 'text', title: '7. Panchakarma & external procedures', fields: [{ key: 'procedures', label: 'Panchakarma & external procedures', rows: 5 }] },
    ],
  },
  follow_up: {
    title: 'Follow Up Sheet',
    short: 'Follow-up sheet',
    sections: [
      { kind: 'text', title: '1. Clinical progress & follow-up treatment plan', fields: [{ key: 'progress', label: 'Clinical progress & follow-up treatment plan', rows: 8 }] },
      { kind: 'prescription', title: '2. Ayurveda herbs & supplement prescription', key: 'prescriptions', rows: 8 },
    ],
  },
}

export type CaseSheetData = Record<string, string | PrescriptionRow[]>

const MAX_TEXT = 4000
const MAX_CELL = 200

const clip = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').slice(0, max) : '')

/**
 * Keeps only the fields the sheet defines, trimmed to sane lengths, with
 * prescription rows padded/cut to the sheet's row count. Whatever a browser
 * sends, only this shape is stored.
 */
export function normalizeSheetData(kind: CaseSheetKind, raw: unknown): CaseSheetData {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: CaseSheetData = {}
  for (const section of SHEETS[kind].sections) {
    if (section.kind === 'prescription') {
      const rows = Array.isArray(src[section.key]) ? (src[section.key] as unknown[]) : []
      out[section.key] = Array.from({ length: section.rows }, (_, i) => {
        const r = (rows[i] && typeof rows[i] === 'object' ? rows[i] : {}) as Record<string, unknown>
        return { medicine: clip(r.medicine, MAX_CELL), dose: clip(r.dose, MAX_CELL), duration: clip(r.duration, MAX_CELL) }
      })
    } else {
      for (const f of section.fields) out[f.key] = clip(src[f.key], section.kind === 'pariksha' ? MAX_CELL : MAX_TEXT)
    }
  }
  return out
}

export function emptySheetData(kind: CaseSheetKind): CaseSheetData {
  return normalizeSheetData(kind, {})
}

/** True when nothing has been written on the sheet yet. */
export function isSheetEmpty(data: CaseSheetData): boolean {
  return Object.values(data).every((v) =>
    typeof v === 'string' ? !v.trim() : v.every((r) => !r.medicine.trim() && !r.dose.trim() && !r.duration.trim()),
  )
}

/** One line for the sheet list, e.g. the start of the chief complaints. */
export function sheetSummary(kind: CaseSheetKind, data: CaseSheetData): string {
  const main = kind === 'primary' ? data.chiefComplaints : data.progress
  const text = typeof main === 'string' ? main.trim().replace(/\s+/g, ' ') : ''
  return text.length > 120 ? `${text.slice(0, 117)}…` : text
}

export function isCaseSheetKind(v: unknown): v is CaseSheetKind {
  return v === 'primary' || v === 'follow_up'
}

/** Age in years on `todayYMD`, from a YYYY-MM-DD date of birth. */
export function ageYears(dob: string | null, todayYMD: string): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ty, tm, td] = todayYMD.split('-').map(Number)
  let years = ty - by
  if (tm < bm || (tm === bm && td < bd)) years -= 1
  return years >= 0 ? years : null
}

/** "34 / Female", "— / Male", or "" when neither is known. */
export function ageGenderText(dob: string | null, gender: string | null, todayYMD: string): string {
  const age = ageYears(dob, todayYMD)
  const g = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : null
  if (age == null && !g) return ''
  return `${age ?? '—'} / ${g ?? '—'}`
}
