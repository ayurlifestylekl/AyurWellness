import type { BookingKind, BookingStatus } from '@/types/booking'

export function flowLabels(
  kind: BookingKind,
  status: BookingStatus,
  legacyApprovedAt?: string | null,
): string[] {
  const labels = ['Slot selected']
  if (legacyApprovedAt || status === 'pending') labels.push('Clinic approval')
  if (kind === 'treatment') labels.push('Payment')
  labels.push(kind === 'consultation' ? 'Confirmed' : 'Confirmation')
  if (status === 'cancelled') labels.push('Cancelled')
  return labels
}
