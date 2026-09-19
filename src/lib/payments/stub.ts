import type {
  CallbackResult,
  CreateBillArgs,
  CreateBillResult,
  PaymentProvider,
  ProviderRefundResult,
  RefundArgs,
  RefundStatusResult,
} from './provider'

/**
 * Test-mode payment. No real money: createBill returns a URL that points
 * straight at our callback with `paid=true`, so the whole approve → pay →
 * confirm flow runs end-to-end. Swap in the Billplz provider for production.
 */
export const stubProvider: PaymentProvider = {
  name: 'stub',

  async createBill(args: CreateBillArgs): Promise<CreateBillResult> {
    const billId = `stub_${args.appointmentId}`
    const url =
      `${args.callbackUrl}?provider=stub&bill_id=${encodeURIComponent(billId)}` +
      `&paid=true&redirect=${encodeURIComponent(args.redirectUrl)}`
    return { billId, url }
  },

  async verifyCallback(req: Request): Promise<CallbackResult> {
    const { searchParams } = new URL(req.url)
    return {
      billId: searchParams.get('bill_id') ?? '',
      paid: searchParams.get('paid') === 'true',
      redirectTo: searchParams.get('redirect') ?? undefined,
    }
  },

  async createRefund(args: RefundArgs): Promise<ProviderRefundResult> {
    return {
      providerRefundId: `stub_refund_${args.idempotencyKey}`,
      status: 'confirmed',
    }
  },

  async fetchRefundStatus(providerRefundId: string): Promise<RefundStatusResult | null> {
    return providerRefundId.startsWith('stub_refund_') ? { status: 'confirmed' } : null
  },
}
