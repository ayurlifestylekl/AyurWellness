import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listPendingPayouts } from '@/lib/admin/agents/payouts-queries'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: Request) {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supabase = await createClient()
  const url = new URL(req.url)
  const idsParam = url.searchParams.get('ids')
  const filterIds = idsParam ? idsParam.split(',').filter(Boolean) : null

  const rows = await listPendingPayouts(supabase)
  const filtered = filterIds ? rows.filter((r) => filterIds.includes(r.agentId)) : rows

  // Format suitable for most Malaysian banks' bulk-transfer template
  const headers = [
    'agent_name',
    'agent_email',
    'referral_code',
    'amount_rm',
    'commission_count',
    'reference',
  ]
  const lines = filtered.map((r) =>
    [
      r.agentName ?? '',
      r.agentEmail ?? '',
      r.referralCode,
      r.pendingTotalRm.toFixed(2),
      r.pendingCount,
      `KAL-COMM-${r.referralCode}-${new Date().toISOString().slice(0, 10)}`,
    ]
      .map(csvCell)
      .join(','),
  )

  const csv = headers.join(',') + '\n' + lines.join('\n') + '\n'

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
