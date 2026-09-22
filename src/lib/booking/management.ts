import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { canManageBooking } from '@/lib/booking/management-access'
import {
  managementEligibility,
  type ManagementEligibility,
  type RefundEligibility,
} from '@/lib/booking/management-policy'
import type { BookingKind } from '@/types/booking'

type RefundStatus = 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception' | 'requested' | 'rejected'
type PaymentDisplay = 'free' | 'unpaid' | 'pending' | 'paid' | 'refund_pending' | 'refunded' | 'refund_needs_review' | 'refund_rejected'

interface BookingRefundRow {
  id: string
  status: RefundStatus
  amount_rm: number | string
  customer_reason?: string | null
  staff_reason?: string | null
}

export interface BookingManagementRow {
  id: string
  customer_id?: string | null
  created_at: string
  appointment_date_time: string
  requested_datetime?: string | null
  status: string
  payment_status: string
  payment_provider?: string | null
  booking_kind?: string | null
  treatment_id?: string | null
  treatment_name?: string | null
  patient_name?: string | null
  assigned_therapist_name?: string | null
  payable_amount_rm?: number | string | null
  group_id?: string | null
  group_management_active?: boolean | null
  booking_refunds?: BookingRefundRow[] | BookingRefundRow | null
  group_members?: BookingManagementRow[]
}

export interface BookingManagementMember {
  id: string
  patientName: string
  treatmentName: string
  selectedTime: string
  status: string
  therapist: string
  payment: BookingPaymentDisplay
  refundEligibility: RefundEligibility
  canReschedule: boolean
  canCancel: boolean
  policyReason: ManagementEligibility['reason']
}

export interface BookingPaymentDisplay {
  status: string
  display: PaymentDisplay
  amountRm: number | null
  provider: string | null
}

export interface BookingRefundDisplay {
  id: string
  status: RefundStatus
  amountRm: number
  customerReason: string | null
  staffReason: string | null
}

export interface BookingManagementModel {
  id: string
  customerId: string | null
  bookingKind: BookingKind
  treatmentId: string | null
  treatmentName: string
  patientName: string
  selectedTime: string
  status: string
  therapist: string
  payment: BookingPaymentDisplay
  refund: BookingRefundDisplay | null
  refundEligibility: RefundEligibility
  canReschedule: boolean
  canCancel: boolean
  changeDeadline: string
  refundDeadline: string
  policyReason: ManagementEligibility['reason']
  groupId: string | null
  groupMembers: BookingManagementMember[]
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function bookingKind(value: string | null | undefined): BookingKind {
  return value === 'consultation' ? 'consultation' : 'treatment'
}

function amount(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function latestRefund(row: BookingManagementRow): BookingRefundDisplay | null {
  const refunds = row.booking_refunds
  const refund = Array.isArray(refunds) ? refunds[0] : refunds
  if (!refund) return null
  return {
    id: refund.id,
    status: refund.status,
    amountRm: Number(refund.amount_rm),
    customerReason: refund.customer_reason ?? null,
    staffReason: refund.staff_reason ?? null,
  }
}

function paymentDisplay(
  row: BookingManagementRow,
  kind: BookingKind,
  refund: BookingRefundDisplay | null,
): BookingPaymentDisplay {
  let display: PaymentDisplay
  if (refund?.status === 'confirmed' || row.payment_status === 'refunded') display = 'refunded'
  else if (refund && ['requested', 'claimed', 'pending'].includes(refund.status)) display = 'refund_pending'
  else if (refund && ['failed', 'exception'].includes(refund.status)) display = 'refund_needs_review'
  else if (refund && refund.status === 'rejected') display = 'refund_rejected'
  else if (kind === 'consultation') display = 'free'
  else if (row.payment_status === 'paid') display = 'paid'
  else if (row.payment_status === 'pending') display = 'pending'
  else display = 'unpaid'

  return {
    status: row.payment_status,
    display,
    amountRm: amount(row.payable_amount_rm),
    provider: row.payment_provider ?? null,
  }
}

function policyFor(row: BookingManagementRow, nowMs: number): ManagementEligibility {
  return managementEligibility({
    createdAt: row.created_at,
    appointmentAt: row.appointment_date_time,
    status: row.status,
    paymentStatus: row.payment_status,
    nowMs,
  })
}

function buildMember(row: BookingManagementRow, nowMs: number): BookingManagementMember {
  const kind = bookingKind(row.booking_kind)
  const refund = latestRefund(row)
  const policy = policyFor(row, nowMs)
  return {
    id: row.id,
    patientName: row.patient_name ?? 'Guest',
    treatmentName: row.treatment_name ?? (kind === 'consultation' ? 'Free Consultation' : 'Treatment'),
    selectedTime: row.appointment_date_time || row.requested_datetime || '',
    status: row.status,
    therapist: row.assigned_therapist_name ?? (kind === 'consultation' ? 'our Vaidya' : 'To be assigned'),
    payment: paymentDisplay(row, kind, refund),
    refundEligibility: policy.refundEligibility,
    canReschedule: policy.canReschedule,
    canCancel: policy.canCancel,
    policyReason: policy.reason,
  }
}

/** Build the customer-facing management state from persisted status and policy only. */
export function buildManagementModel(row: BookingManagementRow, nowMs: number): BookingManagementModel {
  const kind = bookingKind(row.booking_kind)
  const refund = latestRefund(row)
  const policy = policyFor(row, nowMs)
  return {
    id: row.id,
    customerId: row.customer_id ?? null,
    bookingKind: kind,
    treatmentId: row.treatment_id ?? null,
    treatmentName: row.treatment_name ?? (kind === 'consultation' ? 'Free Consultation' : 'Treatment'),
    patientName: row.patient_name ?? 'Guest',
    selectedTime: row.appointment_date_time || row.requested_datetime || '',
    status: row.status,
    therapist: row.assigned_therapist_name ?? (kind === 'consultation' ? 'our Vaidya' : 'To be assigned'),
    payment: paymentDisplay(row, kind, refund),
    refund,
    refundEligibility: policy.refundEligibility,
    canReschedule: policy.canReschedule,
    canCancel: policy.canCancel,
    changeDeadline: policy.changeDeadlineISO,
    refundDeadline: policy.refundDeadlineISO,
    policyReason: policy.reason,
    groupId: row.group_id ?? null,
    groupMembers: (row.group_members ?? []).map((member) => buildMember(member, nowMs)),
  }
}

const MANAGEMENT_COLUMNS = `
  id, customer_id, created_at, appointment_date_time, requested_datetime,
  status, payment_status, payment_provider, booking_kind, treatment_id, treatment_name, patient_name,
  assigned_therapist_name, payable_amount_rm, group_id, group_management_active,
  booking_refunds(id, status, amount_rm, customer_reason, staff_reason, created_at)
`

export async function getBookingManagementModel(
  id: string,
  token: string | null | undefined,
): Promise<BookingManagementModel | null> {
  const sb = admin()
  const { data, error } = await sb
    .from('appointments')
    .select(MANAGEMENT_COLUMNS)
    .eq('id', id)
    .order('created_at', { referencedTable: 'booking_refunds', ascending: false })
    .limit(1, { referencedTable: 'booking_refunds' })
    .maybeSingle()

  if (error || !data) return null
  const row = data as unknown as BookingManagementRow
  if (!(await canManageBooking(id, row.customer_id ?? null, token))) return null

  let groupMembers: BookingManagementRow[] = []
  if (row.group_id) {
    const { data: members } = await sb
      .from('appointments')
      .select(MANAGEMENT_COLUMNS)
      .eq('group_id', row.group_id)
      .eq('group_management_active', true)
      .order('appointment_date_time', { ascending: true })
      .order('created_at', { referencedTable: 'booking_refunds', ascending: false })
      .limit(1, { referencedTable: 'booking_refunds' })
    groupMembers = (members ?? []) as unknown as BookingManagementRow[]
  }

  return buildManagementModel({ ...row, group_members: groupMembers }, Date.now())
}
