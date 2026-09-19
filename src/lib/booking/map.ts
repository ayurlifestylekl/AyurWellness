import type { BookingKind, BookingStatus, Gender, PaymentStatus, StaffAppointment } from '@/types/booking'

/** Columns needed to build a StaffAppointment. */
export const APPOINTMENT_COLUMNS =
  `id, booking_kind, status, payment_status, treatment_name, treatment_id,
   patient_name, patient_phone, patient_gender, gender_requirement, guest_age,
   requested_datetime, requested_datetime_alt, appointment_date_time,
   assigned_therapist_code, assigned_therapist_name, assigned_therapist_gender, duration_mins, payable_amount_rm,
   room, is_guest, customer_id, parent_consultation_id, treatment_unlocked, cancellation_reason, group_id, updated_at,
   approved_at, contacted_at, created_at, created_by_admin_id, payment_expires_at, staff_color_tag`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAppointmentRow(r: any): StaffAppointment {
  return {
    id: r.id,
    bookingKind: (r.booking_kind ?? 'treatment') as BookingKind,
    status: r.status as BookingStatus,
    paymentStatus: (r.payment_status ?? 'unpaid') as PaymentStatus,
    treatmentName: r.treatment_name ?? null,
    treatmentId: r.treatment_id ?? null,
    patientName: r.patient_name ?? null,
    patientPhone: r.patient_phone ?? null,
    patientGender: (r.patient_gender ?? null) as Gender | null,
    guestAge: r.guest_age ?? null,
    genderRequirement:
      r.gender_requirement === 'men_only'
        ? 'male'
        : r.gender_requirement === 'ladies_only'
          ? 'female'
          : null,
    requestedDatetime: r.requested_datetime ?? null,
    requestedDatetimeAlt: r.requested_datetime_alt ?? null,
    appointmentDatetime: r.appointment_date_time ?? null,
    assignedTherapistCode: r.assigned_therapist_code ?? null,
    assignedTherapistName: r.assigned_therapist_name ?? null,
    assignedTherapistGender: (r.assigned_therapist_gender ?? null) as Gender | null,
    durationMins: r.duration_mins ?? null,
    payableAmountRm: r.payable_amount_rm != null ? Number(r.payable_amount_rm) : null,
    room: r.room ?? null,
    isGuest: r.is_guest ?? false,
    customerId: r.customer_id ?? null,
    parentConsultationId: r.parent_consultation_id ?? null,
    treatmentUnlocked: r.treatment_unlocked ?? false,
    cancellationReason: r.cancellation_reason ?? null,
    groupId: r.group_id ?? null,
    createdByAdminId: r.created_by_admin_id ?? null,
    staffColorTag: r.staff_color_tag ?? null,
    createdAt: r.updated_at ?? null,
    requestReceivedAt: r.created_at ?? null,
    approvedAt: r.approved_at ?? null,
    contactedAt: r.contacted_at ?? null,
    paymentExpiresAt: r.payment_expires_at ?? null,
  }
}
