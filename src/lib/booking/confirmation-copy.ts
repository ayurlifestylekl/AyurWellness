import type { BookingKind } from '@/types/booking'

export function confirmationCopy(kind: BookingKind) {
  if (kind === 'consultation') return {
    staffHeading: 'Free consultation confirmed',
    telegramHeading: '🩺 <b>Free consultation confirmed</b>',
    customerHeading: 'Your free consultation is confirmed',
    customerLines: ['Hi {name}, your consultation appointment <strong>to discuss</strong> {treatment} is confirmed for {when}. Please arrive 10 minutes early for your session with our Vaidya.'],
    needsAssignment: false,
  }
  return {
    staffHeading: 'Payment received — booking confirmed',
    telegramHeading: '✅ <b>Payment received — confirmed</b>',
    customerHeading: 'Your appointment is confirmed',
    customerLines: ['A same-gender therapist will be assigned as requested. Please arrive 10 minutes early.'],
    needsAssignment: true,
  }
}
