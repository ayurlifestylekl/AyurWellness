import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getAppointmentById } from '@/lib/dashboard/appointment-queries'
import { toIcsString } from '@/lib/appointments/ical'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (me.role !== 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const id = params.id
  if (!id || id.length < 8) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const supabase = await createClient()
  const appointment = await getAppointmentById(supabase, me.authId, id)
  if (!appointment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ics = toIcsString(appointment, {
    fullName: me.profile.full_name ?? 'Member',
    email: me.email ?? me.identifier ?? '',
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="kal-appointment-${shortId(appointment.id)}.ics"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
