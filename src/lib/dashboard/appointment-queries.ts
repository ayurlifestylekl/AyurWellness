import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export type AppointmentRow = Database['public']['Tables']['appointments']['Row']

// Customer appointment surfaces never need the historical provider identifier.
// Management availability is derived from booking status and server policy.
const CUSTOMER_APPOINTMENT_COLUMNS = `
  id, customer_id, treatment_name, doctor_name, appointment_date_time,
  duration_mins, status, advance_payment_rm, mode, meeting_link, notes, updated_at
`

export interface AppointmentStats {
  upcomingCount: number
  completedThisYear: number
  totalCount: number
  lastCompletedAt: string | null
}

/**
 * Server-side helpers for the Appointments page. RLS auto-filters by
 * auth.uid() so customers only see their own rows.
 */

/** All appointments for a customer, newest scheduled first. */
export async function listAppointments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(CUSTOMER_APPOINTMENT_COLUMNS)
    .eq('customer_id', customerId)
    .order('appointment_date_time', { ascending: false })

  if (error) {
    console.error('[appointments/listAppointments] failed:', error.message)
    return []
  }
  return (data ?? []) as AppointmentRow[]
}

/** Single appointment with ownership check via RLS. */
export async function getAppointmentById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  id: string
): Promise<AppointmentRow | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(CUSTOMER_APPOINTMENT_COLUMNS)
    .eq('id', id)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) {
    console.error('[appointments/getAppointmentById] failed:', error.message)
    return null
  }
  return (data as AppointmentRow | null) ?? null
}

/** Stat tiles on the Appointments hub. */
export async function getAppointmentStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<AppointmentStats> {
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date_time, status')
    .eq('customer_id', customerId)

  if (error) {
    console.error('[appointments/getAppointmentStats] failed:', error.message)
    return { upcomingCount: 0, completedThisYear: 0, totalCount: 0, lastCompletedAt: null }
  }

  const rows = (data ?? []) as Array<
    Pick<AppointmentRow, 'appointment_date_time' | 'status'>
  >
  const now = Date.now()
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime()

  let upcomingCount = 0
  let completedThisYear = 0
  let lastCompletedAt: string | null = null
  let lastCompletedMs = 0

  for (const r of rows) {
    const t = new Date(r.appointment_date_time).getTime()
    if (Number.isNaN(t)) continue
    if (r.status === 'scheduled' && t >= now) upcomingCount += 1
    if (r.status === 'completed' && t >= yearStart) completedThisYear += 1
    if (r.status === 'completed' && t > lastCompletedMs) {
      lastCompletedMs = t
      lastCompletedAt = r.appointment_date_time
    }
  }

  return {
    upcomingCount,
    completedThisYear,
    totalCount: rows.length,
    lastCompletedAt,
  }
}
