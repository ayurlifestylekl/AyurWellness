'use server'

import { z } from 'zod'
import { requireStaff } from '@/lib/staff/guard'
import { dayActivity } from './day-queries'
import { expectedCash, summarizeDay } from './day'
import { toSen } from './rules'

type Result = { ok: true } | { ok: false; error: string }
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const todayMY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())

/** Open the counter for a day with the cash float in the drawer. */
export async function openDay(raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(['admin', 'front_desk'])
  const parsed = z.object({ day: ymd, floatRm: z.number().min(0).max(100_000) }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Enter the cash float, e.g. 200.' }
  if (parsed.data.day > todayMY()) return { ok: false, error: 'You can’t open a day in the future.' }
  const { error } = await db.from('counter_days').insert({ day: parsed.data.day, opening_float_rm: toSen(parsed.data.floatRm) / 100, opened_by: userId })
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return { ok: false, error: 'This day is already open.' }
    console.error('[counter day] open:', error.message)
    return { ok: false, error: 'Could not open the day. Is the setup finished?' }
  }
  return { ok: true }
}

/** Close the day: count the cash, keep a snapshot of the day's figures. */
export async function closeDay(raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(['admin', 'front_desk'])
  const parsed = z
    .object({ day: ymd, countedRm: z.number().min(0).max(1_000_000), notes: z.string().trim().max(1000).optional().transform((v) => (v ? v : null)) })
    .safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Enter the cash you counted.' }
  const v = parsed.data
  const { data: row } = await db.from('counter_days').select('opening_float_rm, closed_at').eq('day', v.day).maybeSingle()
  if (!row) return { ok: false, error: 'Open the day first.' }
  if (row.closed_at) return { ok: false, error: 'This day is already closed.' }
  const act = await dayActivity(db, v.day)
  if (act.error) return { ok: false, error: 'Could not read the day’s bills. Please try again.' }
  const summary = summarizeDay(act.bills, act.money)
  const expected = expectedCash(Number(row.opening_float_rm), summary)
  const counted = toSen(v.countedRm) / 100
  if (counted !== expected && !v.notes) return { ok: false, error: 'The cash doesn’t match — add a note explaining the difference.' }
  const { error } = await db
    .from('counter_days')
    .update({ closed_at: new Date().toISOString(), closed_by: userId, counted_cash_rm: counted, expected_cash_rm: expected, summary, notes: v.notes })
    .eq('day', v.day)
    .is('closed_at', null)
  if (error) {
    console.error('[counter day] close:', error.message)
    return { ok: false, error: 'Could not close the day. Please try again.' }
  }
  return { ok: true }
}

/** Admin only: reopen a closed day (e.g. a late bill or a counting mistake). */
export async function reopenDay(day: string): Promise<Result> {
  const { db } = await requireStaff(['admin'])
  if (!ymd.safeParse(day).success) return { ok: false, error: 'Day not found.' }
  const { error } = await db.from('counter_days').update({ closed_at: null, closed_by: null, counted_cash_rm: null, expected_cash_rm: null, summary: null }).eq('day', day)
  return error ? { ok: false, error: 'Could not reopen the day.' } : { ok: true }
}
