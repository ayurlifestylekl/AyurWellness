export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'packing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'

const TRANSITIONS: Record<FulfillmentStatus, readonly FulfillmentStatus[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['packing', 'cancelled'],
  packing:    ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  ['completed'],
  completed:  [],
  cancelled:  [],
} as const

export function canTransition(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function nextStatuses(from: FulfillmentStatus): readonly FulfillmentStatus[] {
  return TRANSITIONS[from]
}
