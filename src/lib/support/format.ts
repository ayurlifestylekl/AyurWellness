import type { Database } from '@/lib/database.types'
import { CLINIC_LONG_NAME, whatsappLink } from '@/lib/clinic'

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
export type SupportMessage = Database['public']['Tables']['support_messages']['Row']

export type TopicKey = SupportTicket['topic']
export type TicketStatus = SupportTicket['status']
export type SenderKind = SupportMessage['sender_kind']

export const TOPIC_OPTIONS: { value: Exclude<TopicKey, 'welcome'>; label: string }[] = [
  { value: 'treatment', label: 'Treatment question' },
  { value: 'prescription', label: 'Prescription refill' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'order', label: 'Order issue' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
]

export function topicLabel(topic: TopicKey): string {
  switch (topic) {
    case 'treatment':
      return 'Treatment'
    case 'prescription':
      return 'Prescription'
    case 'appointment':
      return 'Appointment'
    case 'order':
      return 'Order'
    case 'billing':
      return 'Billing'
    case 'welcome':
      return 'Welcome'
    case 'other':
    default:
      return 'General'
  }
}

export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'awaiting-customer':
      return 'Awaiting you'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    default:
      return 'Open'
  }
}

export function senderLabel(kind: SenderKind, customerName?: string | null): string {
  switch (kind) {
    case 'customer':
      return customerName || 'You'
    case 'clinic':
      return CLINIC_LONG_NAME
    case 'system':
    default:
      return 'System'
  }
}

/** Build a WhatsApp deep link with text aware of the active topic. */
export function prefillWhatsApp(ticket?: Pick<SupportTicket, 'topic' | 'subject'> | null): string {
  if (!ticket) {
    return whatsappLink('Hi Ayurvedic Wellness Centre, I have a question.')
  }
  const subject = ticket.subject ?? topicLabel(ticket.topic)
  return whatsappLink(
    `Hi Ayurvedic Wellness Centre, I'd like to follow up on: "${subject}".`
  )
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "2 mins ago", "3 hours ago", "yesterday", "14 Mar". */
export function relativeTime(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = nowMs - t
  if (diff < 60 * SECOND) return 'Just now'
  if (diff < HOUR) {
    const mins = Math.round(diff / MINUTE)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diff < DAY) {
    const hours = Math.round(diff / HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  if (diff < 7 * DAY) {
    const days = Math.round(diff / DAY)
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(t))
}

export function isActiveStatus(status: TicketStatus): boolean {
  return status === 'open' || status === 'awaiting-customer'
}

/** Compact "Mar 14 · 4:32 pm" timestamp used inside chat bubbles. */
export function bubbleTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
  return `${date} · ${time}`
}

/** Single-line first-N-chars preview for the list view. */
export function previewBody(body: string, max = 120): string {
  const collapsed = body.replace(/\s+/g, ' ').trim()
  return collapsed.length <= max ? collapsed : collapsed.slice(0, max - 1) + '…'
}
