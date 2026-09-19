export const MISTAKE_WINDOW_MS = 60 * 60 * 1000
export const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000
export const REFUND_ADVANCE_MS = 48 * 60 * 60 * 1000
const ACTIVE_STATUSES: readonly string[] = ['pending', 'scheduled', 'awaiting_payment', 'confirmed']

export type RefundEligibility = 'not_paid' | 'mistake_window' | 'advance_window' | 'not_eligible'
export interface ManagementPolicyInput {
  createdAt: string
  appointmentAt: string
  status: string
  paymentStatus: string
  nowMs: number
}
export interface ManagementEligibility {
  canReschedule: boolean
  canCancel: boolean
  refundEligibility: RefundEligibility
  changeDeadlineISO: string
  refundDeadlineISO: string
  reason: 'eligible' | 'status_closed' | 'appointment_started' | 'change_window_closed' | 'refund_window_closed'
}

export function refundEligibility(input: ManagementPolicyInput): RefundEligibility {
  const created = Date.parse(input.createdAt)
  const appointment = Date.parse(input.appointmentAt)
  const changeMs = appointment - input.nowMs
  const active = ACTIVE_STATUSES.includes(input.status)
  const started = input.nowMs >= appointment

  if (!active || started) return 'not_eligible'

  const unpaid = input.paymentStatus !== 'paid'
  const mistake = !unpaid && input.nowMs - created <= MISTAKE_WINDOW_MS && input.nowMs >= created
  const advance = !unpaid && changeMs >= REFUND_ADVANCE_MS

  return unpaid ? 'not_paid' : mistake ? 'mistake_window' : advance ? 'advance_window' : 'not_eligible'
}

export function managementEligibility(input: ManagementPolicyInput): ManagementEligibility {
  const appointment = Date.parse(input.appointmentAt)
  const active = ACTIVE_STATUSES.includes(input.status)
  const started = input.nowMs >= appointment
  const changeMs = appointment - input.nowMs
  const canReschedule = active && !started && changeMs >= RESCHEDULE_CUTOFF_MS && input.status !== 'awaiting_payment'
  const refund = refundEligibility(input)
  const canCancel = refund !== 'not_eligible'
  return {
    canReschedule,
    canCancel,
    refundEligibility: refund,
    changeDeadlineISO: new Date(appointment - RESCHEDULE_CUTOFF_MS).toISOString(),
    refundDeadlineISO: new Date(appointment - REFUND_ADVANCE_MS).toISOString(),
    reason: !active ? 'status_closed' : started ? 'appointment_started' : canReschedule || canCancel ? 'eligible' : changeMs < RESCHEDULE_CUTOFF_MS ? 'change_window_closed' : 'refund_window_closed',
  }
}
