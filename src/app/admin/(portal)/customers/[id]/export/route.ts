import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin/customers/actions'
import { getCustomerById } from '@/lib/admin/customers/queries'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supabase = await createClient()
  const customer = await getCustomerById(supabase, params.id)
  if (!customer) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: 'admin',
    note: 'PDPA-compliant data export for this customer.',
    customer,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="customer-${params.id.slice(-6)}.json"`,
    },
  })
}
