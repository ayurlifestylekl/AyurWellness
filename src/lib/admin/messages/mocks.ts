/**
 * Demo-only mock tickets for the demo-admin account.
 */
import type { TicketListItem } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

export function isMockTicketId(id: string): boolean {
  return id.startsWith('00000000-mockt-')
}

function hoursAgo(n: number): string {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d.toISOString()
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_TICKETS: TicketListItem[] = [
  {
    id: '00000000-mockt-0001-aaaa-000000000001',
    subject: 'When will my Kesha Thailam arrive?',
    topic: 'order',
    status: 'open',
    unreadByClinic: true,
    lastMessageAt: hoursAgo(2),
    createdAt: hoursAgo(3),
    customerId: '00000000-mockc-0001-aaaa-000000000001',
    customerName: 'Aisha Rahman',
    customerEmail: 'aisha.rahman@example.com',
    customerPhone: '+60 12-345 6789',
    lastMessagePreview: 'Hi, I ordered the hair oil two days ago and haven’t got a tracking number yet. Could you check?',
    assignedToAdminId: null,
  },
  {
    id: '00000000-mockt-0002-aaaa-000000000002',
    subject: 'Question about Brahmi dosage',
    topic: 'prescription',
    status: 'open',
    unreadByClinic: true,
    lastMessageAt: hoursAgo(5),
    createdAt: hoursAgo(6),
    customerId: '00000000-mockc-0002-aaaa-000000000002',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@example.com',
    customerPhone: '+60 12-987 6543',
    lastMessagePreview: 'Should I take Brahmi capsules before or after meals? Two or three a day?',
    assignedToAdminId: null,
  },
  {
    id: '00000000-mockt-0003-aaaa-000000000003',
    subject: 'Need to reschedule Saturday consultation',
    topic: 'appointment',
    status: 'awaiting-customer',
    unreadByClinic: false,
    lastMessageAt: daysAgo(1),
    createdAt: daysAgo(2),
    customerId: '00000000-mockc-0007-aaaa-000000000007',
    customerName: 'Lakshmi Devi',
    customerEmail: 'lakshmi.devi@example.com',
    customerPhone: '+60 14-555 6666',
    lastMessagePreview: 'Sent over a couple of alternative time slots — let me know which works.',
    assignedToAdminId: null,
  },
  {
    id: '00000000-mockt-0004-aaaa-000000000004',
    subject: 'Order #A00004 — wrong item received',
    topic: 'order',
    status: 'open',
    unreadByClinic: true,
    lastMessageAt: hoursAgo(8),
    createdAt: hoursAgo(20),
    customerId: '00000000-mockc-0004-aaaa-000000000004',
    customerName: 'David Lee',
    customerEmail: 'david.lee@example.com',
    customerPhone: '+60 19-876 5432',
    lastMessagePreview: 'I got Kumkumadi serum but I ordered Neelibhringadi oil. Can we swap?',
    assignedToAdminId: null,
  },
  {
    id: '00000000-mockt-0005-aaaa-000000000005',
    subject: 'Refund for cancelled appointment',
    topic: 'billing',
    status: 'resolved',
    unreadByClinic: false,
    lastMessageAt: daysAgo(3),
    createdAt: daysAgo(4),
    customerId: '00000000-mockc-0006-aaaa-000000000006',
    customerName: 'Hassan Ibrahim',
    customerEmail: 'hassan.ibrahim@example.com',
    customerPhone: '+60 18-333 4444',
    lastMessagePreview: 'Thanks, received the refund. All good.',
    assignedToAdminId: null,
  },
  {
    id: '00000000-mockt-0006-aaaa-000000000006',
    subject: 'Welcome — first appointment questions',
    topic: 'welcome',
    status: 'closed',
    unreadByClinic: false,
    lastMessageAt: daysAgo(14),
    createdAt: daysAgo(20),
    customerId: '00000000-mockc-0003-aaaa-000000000003',
    customerName: 'Wei Ming Tan',
    customerEmail: 'weiming.tan@example.com',
    customerPhone: '+60 16-234 5678',
    lastMessagePreview: 'Great, thanks for the warm welcome. See you Wednesday.',
    assignedToAdminId: null,
  },
]

export const MOCK_THREADS: Record<
  string,
  {
    customer: {
      id: string
      full_name: string
      email: string
      phone_number: string
      allergies: string | null
      medical_conditions: string | null
    }
    messages: { id: string; sender_kind: 'customer' | 'clinic' | 'system'; body: string; created_at: string }[]
  }
> = {
  '00000000-mockt-0001-aaaa-000000000001': {
    customer: {
      id: '00000000-mockc-0001-aaaa-000000000001',
      full_name: 'Aisha Rahman',
      email: 'aisha.rahman@example.com',
      phone_number: '+60 12-345 6789',
      allergies: null,
      medical_conditions: null,
    },
    messages: [
      {
        id: 'm1',
        sender_kind: 'customer',
        body: 'Hi, I ordered the Kesha Thailam hair oil two days ago and haven’t got a tracking number yet. Could you check?',
        created_at: hoursAgo(2),
      },
    ],
  },
  '00000000-mockt-0002-aaaa-000000000002': {
    customer: {
      id: '00000000-mockc-0002-aaaa-000000000002',
      full_name: 'Priya Nair',
      email: 'priya.nair@example.com',
      phone_number: '+60 12-987 6543',
      allergies: null,
      medical_conditions: 'mild hypertension',
    },
    messages: [
      {
        id: 'm1',
        sender_kind: 'customer',
        body: 'Should I take Brahmi capsules before or after meals? And is two a day or three?',
        created_at: hoursAgo(5),
      },
    ],
  },
  '00000000-mockt-0003-aaaa-000000000003': {
    customer: {
      id: '00000000-mockc-0007-aaaa-000000000007',
      full_name: 'Lakshmi Devi',
      email: 'lakshmi.devi@example.com',
      phone_number: '+60 14-555 6666',
      allergies: null,
      medical_conditions: null,
    },
    messages: [
      {
        id: 'm1',
        sender_kind: 'customer',
        body: 'I won’t be able to make Saturday’s consultation. Can we move it?',
        created_at: daysAgo(2),
      },
      {
        id: 'm2',
        sender_kind: 'clinic',
        body: 'Of course. We have Sunday 11am, Monday 2pm, or Tuesday 4pm open. Which suits you?',
        created_at: daysAgo(1),
      },
    ],
  },
}
