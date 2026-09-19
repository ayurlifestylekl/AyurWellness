/**
 * Booking & consultation domain types. Mirrors the extended `appointments`
 * table (see supabase/migrations/20260623_booking_system.sql). Kept separate
 * from the generated DB types so UI/server code shares one clean shape.
 */

export type Gender = 'male' | 'female'

export type BookingKind = 'treatment' | 'consultation'

/** Manual front-desk schedule colour palette (client-requested). */
export type StaffColorTag =
  | 'red' | 'blue_light' | 'blue_dark' | 'green_light' | 'green_dark'
  | 'purple' | 'pink' | 'black'

export type BookingStatus =
  | 'pending' // requested, awaiting staff approval
  | 'scheduled'
  | 'awaiting_payment' // approved; customer must pay (treatment path)
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'

/** Health questions captured at booking (stored in appointments.pre_visit_form). */
export interface HealthIntake {
  conditions?: string
  allergies?: string
  medications?: string
  pregnant?: boolean
  /** Female guests only — 'yes' on period, 'no' not on period. */
  onPeriod?: 'yes' | 'no'
  notes?: string
  /** Shirodhara / stress-sleep therapies: customer confirms no dandruff or scalp issues. */
  noDandruffScalpIssues?: boolean
  /** Old-age care therapies: customer confirms no recent surgery, open wounds or skin lesions. */
  noSurgeryWoundSkinLesions?: boolean
  /** Kids therapies: customer confirms no fever, cold or flu. */
  noFeverColdFlu?: boolean
}

/** What the customer submits to request a booking or consultation. */
export interface BookingRequestInput {
  /** Required for treatment bookings; optional for a standalone consultation. */
  treatmentId?: string | null
  bookingKind: BookingKind
  /** Customer's preferred slot (ISO datetime). Staff confirm the real time. */
  preferredAt: string
  /** Historical staff-request field; instant online forms do not submit it. */
  preferredAtAlt?: string | null
  patientName: string
  patientPhone: string
  patientEmail: string
  patientGender: Gender
  isGuest: boolean
  healthIntake: HealthIntake
  /** Gender-matching + cancellation + reschedule policies acknowledged. */
  acceptedPolicies: boolean
  /** Patient age (years). Required for age-gated treatments such as Kids Ayurveda Care. */
  age?: number | null
  /** Set when a treatment booking follows a cleared consultation. */
  parentConsultationId?: string | null
  /** Signed access token for a cleared guest consultation. */
  parentConsultationToken?: string | null
}

/** Row shape used across staff console + customer status views. */
export interface StaffAppointment {
  id: string
  bookingKind: BookingKind
  status: BookingStatus
  paymentStatus: PaymentStatus
  treatmentName: string | null
  treatmentId: string | null
  patientName: string | null
  patientPhone: string | null
  patientGender: Gender | null
  /** Guest age, captured for group bookings. */
  guestAge: number | null
  /** Required therapist gender (= patient gender by policy). */
  genderRequirement: Gender | null
  requestedDatetime: string | null
  requestedDatetimeAlt: string | null
  appointmentDatetime: string | null
  assignedTherapistCode: string | null
  assignedTherapistName: string | null
  assignedTherapistGender: Gender | null
  durationMins: number | null
  payableAmountRm: number | null
  room: string | null
  isGuest: boolean
  customerId: string | null
  parentConsultationId: string | null
  treatmentUnlocked: boolean
  cancellationReason: string | null
  groupId: string | null
  /** Last activity on this row (bumped by the DB touch trigger on every update) — used to sort the "All" list by most recent action, NOT the original submission time. */
  createdAt: string | null
  /** Staff/admin id if the booking was created from the console; null for public web bookings. */
  createdByAdminId: string | null
  /** Manual front-desk schedule colour tag, or null to use the automatic status colour. */
  staffColorTag: StaffColorTag | null
  /** When the customer's web booking actually reached us (immutable, set once on insert). */
  requestReceivedAt: string | null
  /** When staff approved the request (null until approved — also null for
   *  instant bookings, which skip staff review entirely). */
  approvedAt: string | null
  /** Deadline to pay before an awaiting_payment hold is released. */
  paymentExpiresAt: string | null
  /** When staff marked the request as contacted via WhatsApp. */
  contactedAt: string | null
}

/** Doctor's clinical view — booked patients only, with health context. */
export interface DoctorPatientView extends StaffAppointment {
  patientEmail: string | null
  /** From appointments.pre_visit_form (guest/first-timer intake). */
  healthIntake: HealthIntake | null
  /** From the users table — only for signed-in patients. */
  accountHealth: {
    allergies: string | null
    medications: string | null
    conditions: string | null
    heightCm: number | null
    weightKg: number | null
  } | null
  clinicalNotes: string | null
  consultationOutcome: string | null
}
