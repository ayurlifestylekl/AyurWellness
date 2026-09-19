import { NextResponse, type NextRequest } from 'next/server'
import { sweepExpiredBookings } from '@/lib/booking/expiry'

export const dynamic = 'force-dynamic'

/**
 * Scheduled payment-hold sweep (Vercel Cron daily + UptimeRobot every 30 min).
 * The same sweep also runs on staff-console and customer status-page loads —
 * see src/lib/booking/expiry.ts. Protected by CRON_SECRET when set — either as
 * a Bearer token (Vercel Cron) or a `?key=` query param (UptimeRobot's free
 * plan can't send custom headers).
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
    return NextResponse.json(await sweepExpiredBookings())
  } catch (err) {
    console.error('[cron] expire-bookings failed:', err)
    return NextResponse.json(
      { error: 'cron_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

export const GET = handle
export const POST = handle
