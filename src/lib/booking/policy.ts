import type { Gender } from '@/types/booking'

/**
 * Same-gender therapist policy: a patient is only ever matched with a
 * therapist of the same gender. The required therapist gender therefore
 * equals the patient's gender.
 */
export function requiredTherapistGender(patientGender: Gender): Gender {
  return patientGender
}

/** DB enum value (gender_requirement_enum) for the same-gender policy. */
export function genderRequirementValue(patientGender: Gender): 'men_only' | 'ladies_only' {
  return patientGender === 'male' ? 'men_only' : 'ladies_only'
}

/** True if a therapist of `therapist` gender satisfies the appointment's requirement. */
export function therapistMatchesRequirement(
  therapist: Gender,
  requirement: string | null,
): boolean {
  if (!requirement || requirement === 'any') return true
  return (
    (requirement === 'men_only' && therapist === 'male') ||
    (requirement === 'ladies_only' && therapist === 'female')
  )
}

/** Full treatment price is payable. Throws for consultation/enquiry (no fixed price). */
export function payableAmount(priceRm: number | null): number {
  if (priceRm == null) throw new Error('No fixed price; not directly payable')
  return priceRm
}
