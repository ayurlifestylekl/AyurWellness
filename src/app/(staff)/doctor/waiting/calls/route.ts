import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/staff/guard'
import { callsResponse } from '@/lib/staff/queue-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Today's calls, for the lobby screen to announce. */
export async function GET() {
  try {
    const { db } = await requireStaff(['admin', 'doctor'])
    return callsResponse(db)
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
}
