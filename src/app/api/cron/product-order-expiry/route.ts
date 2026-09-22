import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSb } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
    },
  )
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const sb = admin()
  const { data, error } = await sb.rpc('sweep_expired_product_orders')
  if (error) {
    console.error('[cron product-order-expiry] sweep failed', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const expired = (data ?? []) as Array<{ order_id: string; order_number: string }>
  return NextResponse.json({ expired: expired.length, orders: expired })
}
