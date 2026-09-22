import { NextResponse, type NextRequest } from 'next/server'
import { startPaymentForAppointment } from '@/lib/booking/payment'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.nextUrl.searchParams.get('t')
  const res = await startPaymentForAppointment(params.id, token)
  if ('error' in res) {
    // Back to checkout — that's where the payment buttons live; it self-redirects
    // to the status page when the booking is no longer payable.
    const t = token ? `?t=${token}&payerror=1` : '?payerror=1'
    return NextResponse.redirect(new URL(`/book/request/${params.id}/checkout${t}`, req.url))
  }
  return NextResponse.redirect(res.url)
}
