import { NextResponse } from 'next/server'
import { createClient as createSb } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Keep-alive / health check. Performs one trivial Supabase read so the free
 * tier never counts the project as inactive (free projects pause after 7 idle
 * days). Hit daily by Vercel Cron, and optionally by an external uptime
 * monitor (e.g. UptimeRobot) for redundancy — it's cheap and unauthenticated,
 * returning nothing but an ok flag.
 */
export async function GET() {
  try {
    const sb = createSb(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error } = await sb.from('appointments').select('id', { count: 'exact', head: true }).limit(1)
    if (error) return NextResponse.json({ ok: false }, { status: 503 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
