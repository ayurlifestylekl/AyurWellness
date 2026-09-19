import { expectTypeOf, it } from 'vitest'
import type { BookingKind } from '@/types/booking'
import type { notifyConfirmed } from '../notify'

type NotifyConfirmedInput = Parameters<typeof notifyConfirmed>[0]

it('requires callers to identify the confirmed booking kind', () => {
  const valid: NotifyConfirmedInput = {
    to: 'patient@example.com',
    whenISO: '2026-07-17T10:00:00.000Z',
    bookingKind: 'treatment',
  }

  // @ts-expect-error bookingKind must be explicit so consultation copy cannot fall back to treatment wording
  const missingBookingKind: NotifyConfirmedInput = {
    to: 'patient@example.com',
    whenISO: '2026-07-17T10:00:00.000Z',
  }

  expectTypeOf(valid.bookingKind).toEqualTypeOf<BookingKind>()
  void missingBookingKind
})
