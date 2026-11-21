import { PATIENT_ID_PREFIX } from '@/lib/clinic'

/** 12 → "AWC-00012". Null until the patient has a saved record. */
export function formatPatientNo(no: number | null | undefined): string | null {
  if (no == null || !Number.isFinite(no)) return null
  return `${PATIENT_ID_PREFIX}-${String(Math.trunc(no)).padStart(5, '0')}`
}
