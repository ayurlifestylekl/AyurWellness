import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { buildExport } from '@/lib/account/export'

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const supabase = await createClient()
  const bundle = await buildExport(supabase, me.authId)
  const filename = `kerala-ayurvedic-data-${me.authId.slice(0, 8)}.json`
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
