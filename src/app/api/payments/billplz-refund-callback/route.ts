import { NextResponse, type NextRequest } from 'next/server'
import { billplzProvider } from '@/lib/payments/billplz'
import { applyRefundCallback } from '@/lib/payments/refund'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const callback = await billplzProvider.verifyRefundCallback?.(req)
    if (!callback) return NextResponse.json({ ok: false }, { status: 401 })

    // The signed callback is redacted before this lookup. The conditional
    // transition inside applyRefundCallback makes terminal duplicates a no-op.
    await applyRefundCallback(callback)
    return NextResponse.json({ ok: true })
  } catch {
    console.error('[billplz refund callback] processing failed')
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
