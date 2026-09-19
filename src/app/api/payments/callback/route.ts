import { NextResponse, type NextRequest } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { markBillPaid, reconcileByBill } from '@/lib/booking/payment'
import { paymentCallbackResponse } from '@/lib/booking/payment-result'

export const dynamic = 'force-dynamic'

async function handle(req: NextRequest) {
  try {
    const provider = getPaymentProvider()
    const result = await provider.verifyCallback(req)
    if (result.paid && result.billId) {
      const confirmation = await markBillPaid(result.billId)
      const response = paymentCallbackResponse(confirmation)
      if (!response.ok) {
        console.error('[payment callback] transient confirmation failure for bill', result.billId)
        return NextResponse.json(response, { status: response.status })
      }
    } else if (result.billId) {
      // Signature check failed or the paid flag wasn't set — don't silently drop
      // it. Ask the provider's API directly; confirm only if it's genuinely paid.
      const reconciliation = await reconcileByBill(result.billId)
      if ('disposition' in reconciliation) {
        const response = paymentCallbackResponse(reconciliation)
        if (!response.ok) return NextResponse.json(response, { status: response.status })
      }
    }
    // Stub return flow carries a redirect back to the customer status page.
    if (result.redirectTo) {
      return NextResponse.redirect(new URL(result.redirectTo, req.url))
    }
    // Real gateways (Billplz) just need a 200 ack.
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[payment callback] processing failed', error)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}

export const GET = handle
export const POST = handle
