'use server'

import { z } from 'zod'
import { requireStaff } from '@/lib/staff/guard'
import { dayActivity } from './day-queries'
import { breakdownTotal, cleanBreakdown, expectedCash, summarizeDay } from './day'
import { toSen } from './rules'

type Result = { ok: true } | { ok: false; error: string }
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const todayMY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())

/** Open the counter for a day with the cash float in the drawer. */
export async function openDay(raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(['admin', 'front_desk'])
  const parsed = z.object({ day: ymd, floatRm: z.number().min(0).max(100_000), breakdown: z.unknown().optional() }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Enter the cash float, e.g. 200.' }
  if (parsed.data.day > todayMY()) return { ok: false, error: 'You can’t open a day in the future.' }
  // Counted by notes and coins: the total is what they add up to.
  const breakdown = parsed.data.breakdown ? cleanBreakdown(parsed.data.breakdown) : null
  const floatRm = breakdown ? breakdownTotal(breakdown) : toSen(parsed.data.floatRm) / 100
  const row: Record<string, unknown> = { day: parsed.data.day, opening_float_rm: floatRm, opened_by: userId }
  let { error } = await db.from('counter_days').insert(breakdown ? { ...row, opening_breakdown: breakdown } : row)
  // Before 20261130_centre_requests.sql there is nowhere to keep the breakdown: keep the total.
  if (error && breakdown && /opening_breakdown/.test(error.message)) ({ error } = await db.from('counter_days').insert(row))
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
    .object({ day: ymd, countedRm: z.number().min(0).max(1_000_000), breakdown: z.unknown().optional(), notes: z.string().trim().max(1000).optional().transform((v) => (v ? v : null)) })
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
  const breakdown = v.breakdown ? cleanBreakdown(v.breakdown) : null
  const counted = breakdown ? breakdownTotal(breakdown) : toSen(v.countedRm) / 100
  if (counted !== expected && !v.notes) return { ok: false, error: 'The cash doesn’t match — add a note explaining the difference.' }
  const patch = { closed_at: new Date().toISOString(), closed_by: userId, counted_cash_rm: counted, expected_cash_rm: expected, summary, notes: v.notes }
  const close = (p: Record<string, unknown>) => db.from('counter_days').update(p).eq('day', v.day).is('closed_at', null)
  let { error } = await close(breakdown ? { ...patch, closing_breakdown: breakdown } : patch)
  if (error && breakdown && /closing_breakdown/.test(error.message)) ({ error } = await close(patch))
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
  let { error } = await db.from('counter_days').update({ closed_at: null, closed_by: null, counted_cash_rm: null, expected_cash_rm: null, summary: null, closing_breakdown: null }).eq('day', day)
  if (error && /closing_breakdown/.test(error.message)) ({ error } = await db.from('counter_days').update({ closed_at: null, closed_by: null, counted_cash_rm: null, expected_cash_rm: null, summary: null }).eq('day', day))
  return error ? { ok: false, error: 'Could not reopen the day.' } : { ok: true }
}
