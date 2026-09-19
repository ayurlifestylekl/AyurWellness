export interface ConfirmedPaymentRow {
  id: string
  patient_name?: string | null
  guest_age?: number | null
  treatment_name?: string | null
  appointment_date_time?: string | null
  patient_email?: string | null
}

export interface PaymentConfirmationResult {
  state: 'confirmed' | 'already_confirmed' | 'not_payable' | 'not_found'
  leadId: string | null
  groupId: string | null
  bookingStatus: string | null
  shouldAlert: boolean
  rows: ConfirmedPaymentRow[]
}

export type PaymentHandlingResult =
  | { disposition: 'terminal'; state: 'confirmed' | 'already_confirmed'; appointmentId: string }
  | { disposition: 'terminal'; state: 'not_payable'; bookingId: string }
  // The provider was reachable and gave a definite answer: this bill is not
  // paid. That's a final negative, not a glitch — acking it (no retry) is
  // correct; the webhook/callback that eventually reports it paid will still
  // land and confirm normally.
  | { disposition: 'final'; state: 'provider_not_paid' }
  // Genuinely transient: we could not get a definite answer (DB unreachable,
  // provider unqueryable, malformed RPC result), or the bill doesn't match an
  // appointment YET — a real race against startPaymentForAppointment's
  // create-bill-then-associate sequence, so retrying can still resolve it.
  | { disposition: 'transient'; state: 'not_found' | 'rpc_error' | 'invalid_result' | 'provider_unconfirmed' }

const INVALID_RESULT = 'Invalid payment confirmation result.'

function invalid(): never {
  throw new Error(INVALID_RESULT)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || isNullableString(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseRow(value: unknown): ConfirmedPaymentRow {
  if (!isRecord(value) || !isNonBlankString(value.id)) invalid()
  if (!isOptionalNullableString(value.patient_name)) invalid()
  if (!isOptionalNullableString(value.treatment_name)) invalid()
  if (!isOptionalNullableString(value.appointment_date_time)) invalid()
  if (!isOptionalNullableString(value.patient_email)) invalid()
  if (
    value.guest_age !== undefined
    && value.guest_age !== null
    && (typeof value.guest_age !== 'number' || !Number.isFinite(value.guest_age))
  ) invalid()
  return {
    id: value.id,
    patient_name: value.patient_name,
    guest_age: value.guest_age,
    treatment_name: value.treatment_name,
    appointment_date_time: value.appointment_date_time,
    patient_email: value.patient_email,
  }
}

export function parsePaymentConfirmation(data: unknown): PaymentConfirmationResult {
  if (!isRecord(data)) invalid()
  const { state, lead_id: leadId, group_id: groupId, booking_status: bookingStatus, should_alert: shouldAlert } = data
  if (typeof state !== 'string' || !['confirmed', 'already_confirmed', 'not_payable', 'not_found'].includes(state)) invalid()
  if (!isNullableString(leadId) || !isNullableString(groupId) || !isNullableString(bookingStatus)) invalid()
  if (typeof shouldAlert !== 'boolean' || !Array.isArray(data.rows)) invalid()
  if (typeof groupId === 'string' && !isNonBlankString(groupId)) invalid()

  const rows = data.rows.map(parseRow)
  if (state === 'not_found') {
    if (leadId !== null || groupId !== null || bookingStatus !== null || shouldAlert || rows.length !== 0) invalid()
  } else {
    if (!isNonBlankString(leadId)) invalid()
    if (state === 'confirmed') {
      if (bookingStatus !== 'confirmed' || shouldAlert || rows.length === 0 || !rows.some((row) => row.id === leadId)) invalid()
    } else if (state === 'already_confirmed') {
      if (bookingStatus !== 'confirmed' || shouldAlert || rows.length !== 0) invalid()
    } else {
      if (!isNonBlankString(bookingStatus) || bookingStatus === 'confirmed' || bookingStatus === 'awaiting_payment') invalid()
      if (rows.length !== 1 || rows[0].id !== leadId) invalid()
    }
  }

  return {
    state: state as PaymentConfirmationResult['state'],
    leadId,
    groupId,
    bookingStatus,
    shouldAlert,
    rows,
  }
}

export function classifyPaymentConfirmation(result: PaymentConfirmationResult): PaymentHandlingResult {
  if (result.state === 'not_found') return { disposition: 'transient', state: 'not_found' }
  if (result.state === 'not_payable') return { disposition: 'terminal', state: 'not_payable', bookingId: result.leadId! }
  return { disposition: 'terminal', state: result.state, appointmentId: result.leadId! }
}

export function paymentCallbackResponse(result: PaymentHandlingResult): { status: 200 | 503; ok: boolean } {
  // Only a genuinely transient failure should make the provider retry.
  // 'terminal' (confirmed/not_payable) and 'final' (definitely not paid) are
  // both settled outcomes — ack them so the provider stops retrying forever.
  return result.disposition === 'transient'
    ? { status: 503, ok: false }
    : { status: 200, ok: true }
}

export function paymentProblemAlertInput(result: PaymentConfirmationResult): {
  name: string | null | undefined
  treatmentName: string | null | undefined
  bookingStatus: string
} | null {
  if (result.state !== 'not_payable' || !result.shouldAlert) return null
  const lead = result.rows[0]
  return {
    name: lead.patient_name,
    treatmentName: lead.treatment_name,
    bookingStatus: result.bookingStatus!,
  }
}

export async function persistBillAssociation(args: {
  billId: string
  expectedCount: number
  associate: () => Promise<{ count: number | null; error: unknown | null }>
  deactivate: (billId: string) => Promise<void>
  alert: (billId: string) => Promise<void>
}): Promise<'associated' | 'failed'> {
  try {
    const result = await args.associate()
    if (!result.error && result.count === args.expectedCount) return 'associated'
  } catch {
    // Cleanup below is required for both rejected and ambiguous writes.
  }
  await Promise.allSettled([args.deactivate(args.billId), args.alert(args.billId)])
  return 'failed'
}
