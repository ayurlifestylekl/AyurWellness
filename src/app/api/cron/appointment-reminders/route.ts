import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import { fmtMY } from '@/lib/datetime'
import { createBookingToken } from '@/lib/booking/token'

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

// Vercel Cron sends GET; UptimeRobot-style manual triggers may use POST — accept both.
async function handle(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()
  const lowerBound = new Date(nowMs + 72 * 60 * 60 * 1000).toISOString()
  const upperBound = new Date(nowMs + 73 * 60 * 60 * 1000).toISOString()

  const { data, error } = await sb
    .from('appointments')
    .select('id, patient_email, patient_name, treatment_name, appointment_date_time, customer_id, group_id')
    .eq('status', 'confirmed')
    .is('management_reminder_sent_at', null)
    .gte('appointment_date_time', lowerBound)
    .lt('appointment_date_time', upperBound)

  if (error) {
    console.error('[cron/reminders] Failed to query:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const a of data ?? []) {
    if (!a.patient_email) {
      skipped++
      continue
    }

    const { error: claimErr, count } = await sb
      .from('appointments')
      .update({ management_reminder_sent_at: nowISO })
      .eq('id', a.id)
      .is('management_reminder_sent_at', null)

    if (claimErr || count === 0) {
      skipped++
      continue
    }

    // Guests have no session, so the reminder link must carry a signed access
    // token — the same one used everywhere else a guest reaches their booking
    // (confirmation emails, checkout, status page). Signed-in customers accept
    // it too, since canManageBooking checks ownership as a fallback.
    const manageUrl = `${SITE}/book/request/${a.id}?t=${createBookingToken(a.id)}`

    const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#12372D">
  <h1 style="font-family:'Helvetica Neue',sans-serif;font-size:22px;font-weight:700;margin:0 0 16px">Upcoming Appointment</h1>
  <p style="line-height:1.65">Hi ${a.patient_name ?? 'there'},</p>
  <p style="line-height:1.65">This is a reminder for your upcoming appointment in a few days.</p>
  <div style="margin:24px 0;padding:18px 20px;border:1px solid rgba(18, 55, 45,0.1);border-radius:18px;background:#EDF4E7">
    <p style="margin:0;font-weight:700;font-size:16px">${a.treatment_name ?? 'Treatment'}</p>
    <p style="margin:6px 0 0;color:#12372D">${fmtMY(a.appointment_date_time, { dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>
  <p><a href="${manageUrl}" style="display:inline-block;background:#149447;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">Manage booking</a></p>
  <p style="margin-top:32px;color:#666">With warmth,<br/>Ayurvedic Wellness Centre</p>
</div>`

    const text = `Hi ${a.patient_name ?? 'there'},\n\nThis is a reminder for your upcoming appointment.\n\n${a.treatment_name ?? 'Treatment'}\n${fmtMY(a.appointment_date_time, { dateStyle: 'full', timeStyle: 'short' })}\n\nManage booking: ${manageUrl}`

    const res = await sendEmail({
      to: a.patient_email,
      category: 'reminder',
      subject: `Upcoming appointment: ${a.treatment_name ?? 'Treatment'}`,
      html,
      text,
      userId: a.customer_id ?? undefined,
    })

    if (res.sent) sent++
    else skipped++
  }

  return NextResponse.json({ ok: true, sent, skipped })
}

export const dynamic = 'force-dynamic'
export const GET = handle
export const POST = handle
