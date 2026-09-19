import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listLeads, leadsToCsv } from '@/lib/admin/leads/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const supabase = await createClient()
  const csv = leadsToCsv(await listLeads(supabase))
  // Leading BOM so Excel opens UTF-8 correctly.
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
