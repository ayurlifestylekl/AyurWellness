import { NextResponse, type NextRequest } from 'next/server'
import { reconcilePendingRefunds, bookingRefundDependencies, productRefundDependencies } from '@/lib/payments/refund'

export const dynamic = 'force-dynamic'

/**
 * Polls the payment provider for any refund still 'pending' (bank-transfer
 * refunds aren't instant) and resolves it to confirmed/exception. Covers both
 * booking_refunds and product_refund_requests via the shared refund engine.
 * Same auth pattern as expire-bookings: Vercel Cron daily (baseline) +
 * UptimeRobot every ~30 min for the cadence refunds actually need.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorized =
    !secret ||
    req.headers.get('authorization') === `Bearer ${secret}` ||
    req.nextUrl.searchParams.get('key') === secret
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const [bookings, products] = await Promise.all([
      reconcilePendingRefunds(bookingRefundDependencies()),
      reconcilePendingRefunds(productRefundDependencies()),
    ])
    return NextResponse.json({ bookings, products })
  } catch (err) {
    console.error('[cron] reconcile-refunds failed:', err)
    return NextResponse.json(
      { error: 'cron_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export const GET = handle
export const POST = handle
