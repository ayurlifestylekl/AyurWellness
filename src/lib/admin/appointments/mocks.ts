/**
 * Demo-only mock appointments. Shown to the demo-admin account when the
 * DB has no real appointments. Zero DB writes.
 */
import type { AppointmentListItem } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

export function isMockAppointmentId(id: string): boolean {
  return id.startsWith('00000000-mocka-')
}

function todayAt(h: number, m = 0): string {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
function daysAhead(n: number, h = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}
function daysAgo(n: number, h = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}

export const MOCK_APPOINTMENTS: AppointmentListItem[] = [
  {
    id: '00000000-mocka-0001-aaaa-000000000001',
    appointmentDateTime: todayAt(10, 0),
    customerId: '00000000-mockc-0002-aaaa-000000000002',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@example.com',
    customerPhone: '+60 12-987 6543',
    treatmentName: 'Shirodhara',
    doctorName: 'our Vaidya',
    durationMins: 60,
    status: 'confirmed',
    mode: 'in-person',
    room: 'Therapy room A',
    advancePaymentRm: 150,
    advancePaymentStatus: 'paid',
    calcomBookingUid: 'cal-bk-001',
  },
  {
    id: '00000000-mocka-0002-aaaa-000000000002',
    appointmentDateTime: todayAt(13, 30),
    customerId: '00000000-mockc-0001-aaaa-000000000001',
    customerName: 'Aisha Rahman',
    customerEmail: 'aisha.rahman@example.com',
    customerPhone: '+60 12-345 6789',
    treatmentName: 'Abhyanga',
    doctorName: 'our Vaidya',
    durationMins: 90,
    status: 'checked_in',
    mode: 'in-person',
    room: 'Therapy room B',
    advancePaymentRm: 220,
    advancePaymentStatus: 'paid',
    calcomBookingUid: 'cal-bk-002',
  },
  {
    id: '00000000-mocka-0003-aaaa-000000000003',
    appointmentDateTime: todayAt(16, 0),
    customerId: '00000000-mockc-0007-aaaa-000000000007',
    customerName: 'Lakshmi Devi',
    customerEmail: 'lakshmi.devi@example.com',
    customerPhone: '+60 14-555 6666',
    treatmentName: 'Online Consultation',
    doctorName: 'our Vaidya',
    durationMins: 30,
    status: 'pending',
    mode: 'virtual',
    room: null,
    advancePaymentRm: 80,
    advancePaymentStatus: 'pending',
    calcomBookingUid: 'cal-bk-003',
  },
  {
    id: '00000000-mocka-0004-aaaa-000000000004',
    appointmentDateTime: daysAhead(1, 11),
    customerId: '00000000-mockc-0004-aaaa-000000000004',
    customerName: 'David Lee',
    customerEmail: 'david.lee@example.com',
    customerPhone: '+60 19-876 5432',
    treatmentName: 'Panchakarma Consultation',
    doctorName: 'our Vaidya',
    durationMins: 60,
    status: 'confirmed',
    mode: 'in-person',
    room: null,
    advancePaymentRm: 100,
    advancePaymentStatus: 'paid',
    calcomBookingUid: 'cal-bk-004',
  },
  {
    id: '00000000-mocka-0005-aaaa-000000000005',
    appointmentDateTime: daysAhead(2, 14),
    customerId: '00000000-mockc-0003-aaaa-000000000003',
    customerName: 'Wei Ming Tan',
    customerEmail: 'weiming.tan@example.com',
    customerPhone: '+60 16-234 5678',
    treatmentName: 'Initial Consultation',
    doctorName: 'our Vaidya',
    durationMins: 45,
    status: 'scheduled',
    mode: 'in-person',
    room: null,
    advancePaymentRm: null,
    advancePaymentStatus: 'pending',
    calcomBookingUid: 'cal-bk-005',
  },
  {
    id: '00000000-mocka-0006-aaaa-000000000006',
    appointmentDateTime: daysAgo(3, 10),
    customerId: '00000000-mockc-0005-aaaa-000000000005',
    customerName: 'Siti Hasan',
    customerEmail: 'siti.hasan@example.com',
    customerPhone: '+60 13-111 2222',
    treatmentName: 'Shirodhara',
    doctorName: 'our Vaidya',
    durationMins: 60,
    status: 'completed',
    mode: 'in-person',
    room: 'Therapy room A',
    advancePaymentRm: 150,
    advancePaymentStatus: 'paid',
    calcomBookingUid: 'cal-bk-006',
  },
  {
    id: '00000000-mocka-0007-aaaa-000000000007',
    appointmentDateTime: daysAgo(5, 15),
    customerId: '00000000-mockc-0006-aaaa-000000000006',
    customerName: 'Hassan Ibrahim',
    customerEmail: 'hassan.ibrahim@example.com',
    customerPhone: '+60 18-333 4444',
    treatmentName: 'Abhyanga',
    doctorName: 'our Vaidya',
    durationMins: 90,
    status: 'no_show',
    mode: 'in-person',
    room: 'Therapy room B',
    advancePaymentRm: 220,
    advancePaymentStatus: 'paid',
    calcomBookingUid: 'cal-bk-007',
  },
  {
    id: '00000000-mocka-0008-aaaa-000000000008',
    appointmentDateTime: daysAgo(7, 11),
    customerId: '00000000-mockc-0002-aaaa-000000000002',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@example.com',
    customerPhone: '+60 12-987 6543',
    treatmentName: 'Follow-up Consultation',
    doctorName: 'our Vaidya',
    durationMins: 30,
    status: 'cancelled',
    mode: 'virtual',
    room: null,
    advancePaymentRm: null,
    advancePaymentStatus: 'refunded',
    calcomBookingUid: 'cal-bk-008',
  },
]
