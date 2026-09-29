import { NextResponse, type NextRequest } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { markBillPaid, reconcileByBill } from '@/lib/booking/payment'
import { markProductBillPaid, reconcileProductOrderByBill } from '@/lib/checkout/payment'
import { paymentCallbackResponse } from '@/lib/booking/payment-result'

export const dynamic = 'force-dynamic'

async function handle(req: NextRequest) {
  try {
    const provider = getPaymentProvider()
    const result = await provider.verifyCallback(req)
    // Only a signed webhook may confirm payment directly. Anything else (e.g. a
    // browser return URL carrying status=completed) is re-checked with the provider.
    const confirmedPaid = result.paid && result.verified
    if (result.billId) {
      // Try product orders first; if this bill isn't one, fall through to bookings.
      const productResult = confirmedPaid
        ? await markProductBillPaid(result.billId)
        : await reconcileProductOrderByBill(result.billId)
      if (!productResult.ok) {
        console.error('[payment callback] product order confirmation failed', result.billId, productResult)
        return NextResponse.json({ ok: false }, { status: 503 })
      }
      if (productResult.state !== 'not_found') {
        // Product order matched — ack so the gateway stops retrying.
        if (result.redirectTo) {
          return NextResponse.redirect(new URL(result.redirectTo, req.url))
        }
        return NextResponse.json({ ok: true })
      }
      // No product order matched — this is a booking payment.
      if (confirmedPaid) {
        const confirmation = await markBillPaid(result.billId)
        const response = paymentCallbackResponse(confirmation)
        if (!response.ok) {
          console.error('[payment callback] transient confirmation failure for bill', result.billId)
          return NextResponse.json(response, { status: response.status })
        }
      } else {
        // Unverified or unpaid — ask the provider's API directly and confirm only
        // if it's genuinely paid.
        const reconciliation = await reconcileByBill(result.billId)
        if ('disposition' in reconciliation) {
          const response = paymentCallbackResponse(reconciliation)
          if (!response.ok) return NextResponse.json(response, { status: response.status })
        }
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
