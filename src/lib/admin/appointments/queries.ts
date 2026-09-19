import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']
export type AppointmentStatus = AppointmentRow['status']
export type AppointmentMode = AppointmentRow['mode']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface AppointmentListItem {
  id: string
  appointmentDateTime: string
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  treatmentName: string
  doctorName: string
  durationMins: number
  status: AppointmentStatus
  mode: AppointmentMode
  room: string | null
  advancePaymentRm: number | null
  advancePaymentStatus: string | null
  calcomBookingUid: string | null
}

export interface AppointmentFilters {
  segment?: 'needs_therapist' | 'awaiting_payment' | 'all' | 'today' | 'upcoming' | 'past' | 'cancelled' | 'no_show'
  search?: string
  status?: AppointmentStatus
  limit?: number
  offset?: number
}

export async function listAppointments(
  supabase: SB,
  filters: AppointmentFilters = {},
): Promise<{ items: AppointmentListItem[]; total: number }> {
  let q = supabase
    .from('appointments')
    .select(
      `id, appointment_date_time, customer_id, treatment_name, doctor_name,
       duration_mins, status, mode, room, advance_payment_rm,
       advance_payment_status, calcom_booking_uid, assigned_therapist_code,
       customer:users!appointments_customer_id_fkey(full_name, email, phone_number)`,
      { count: 'exact' },
    )

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  if (filters.segment === 'needs_therapist') {
    q = q.in('status', ['confirmed', 'checked_in', 'in_progress']).is('assigned_therapist_code', null)
    q = q.order('appointment_date_time', { ascending: true })
  } else if (filters.segment === 'awaiting_payment') {
    q = q.eq('status', 'awaiting_payment')
    q = q.order('appointment_date_time', { ascending: true })
  } else if (filters.segment === 'today') {
    q = q.gte('appointment_date_time', todayStart).lt('appointment_date_time', todayEnd)
    q = q.order('appointment_date_time', { ascending: true })
  } else if (filters.segment === 'upcoming') {
    q = q.gte('appointment_date_time', todayEnd)
    q = q.in('status', ['pending', 'scheduled', 'confirmed', 'checked_in', 'in_progress'])
    q = q.order('appointment_date_time', { ascending: true })
  } else if (filters.segment === 'past') {
    q = q.lt('appointment_date_time', todayStart)
    q = q.order('appointment_date_time', { ascending: false })
  } else if (filters.segment === 'cancelled') {
    q = q.eq('status', 'cancelled')
    q = q.order('appointment_date_time', { ascending: false })
  } else if (filters.segment === 'no_show') {
    q = q.eq('status', 'no_show')
    q = q.order('appointment_date_time', { ascending: false })
  } else {
    q = q.order('appointment_date_time', { ascending: false })
  }

  if (filters.status) q = q.eq('status', filters.status)
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    q = q.or(`treatment_name.ilike.%${s}%,doctor_name.ilike.%${s}%`)
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 100
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/appointments] listAppointments failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((r): AppointmentListItem => {
    const cust = Array.isArray(r.customer) ? r.customer[0] : r.customer
    return {
      id: r.id,
      appointmentDateTime: r.appointment_date_time,
      customerId: r.customer_id,
      customerName: cust?.full_name ?? null,
      customerEmail: cust?.email ?? null,
      customerPhone: cust?.phone_number ?? null,
      treatmentName: r.treatment_name,
      doctorName: r.doctor_name,
      durationMins: r.duration_mins,
      status: r.status,
      mode: r.mode,
      room: r.room,
      advancePaymentRm: r.advance_payment_rm != null ? Number(r.advance_payment_rm) : null,
      advancePaymentStatus: r.advance_payment_status,
      calcomBookingUid: r.calcom_booking_uid,
    }
  })

  // Customer-name search post-filter (Supabase's nested-ilike is finicky)
  let final = items
  if (filters.search) {
    const s = filters.search.toLowerCase()
    final = items.filter((it) => {
      const hay = [it.customerName, it.customerEmail, it.treatmentName, it.doctorName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(s)
    })
  }

  return { items: final, total: filters.search ? final.length : count ?? 0 }
}

export async function getAppointmentById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `*,
       customer:users!appointments_customer_id_fkey(id, full_name, email, phone_number,
         date_of_birth, gender, allergies, current_medications, medical_conditions),
       rescheduled_from:appointments!appointments_rescheduled_from_id_fkey(id, appointment_date_time, status)`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/appointments] getAppointmentById failed:', error.message)
    return null
  }
  return data
}

/** Count paid/confirmed appointments still requiring therapist assignment. */
export async function countPendingRequests(supabase: SB): Promise<number> {
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .in('status', ['confirmed', 'checked_in', 'in_progress'])
    .is('assigned_therapist_code', null)
  return count ?? 0
}

export async function countTodayAppointments(supabase: SB): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('appointment_date_time', start)
    .lt('appointment_date_time', end)
    .in('status', ['pending', 'scheduled', 'confirmed', 'checked_in', 'in_progress'])
  return count ?? 0
}
