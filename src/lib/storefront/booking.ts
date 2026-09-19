/**
 * Customer-facing booking reads. The status/pay page fetches a single
 * appointment by id via the service role (guests have no session); the
 * account dashboard lists a signed-in customer's own bookings via their
 * authed client (RLS scopes to customer_id = auth.uid()).
 */
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createSb } from '@supabase/supabase-js'
import type { StaffAppointment } from '@/types/booking'
import { APPOINTMENT_COLUMNS, mapAppointmentRow } from '@/lib/booking/map'
import { type Announcement, mapAnnouncementRow, pickActive, mytTodayYMD } from '@/lib/booking/announcements'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // The customer status/pay page MUST reflect the live booking state. Next.js
      // caches fetch() by default (keyed per booking id), which would freeze the
      // page at whatever status it had on first view — so approval/payment never
      // appear. Force every read from this client to bypass the Data Cache.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    },
  )
}

/** Single booking by id (service role) — used by the public status/pay page. */
export async function getBookingForPayment(id: string): Promise<StaffAppointment | null> {
  const { data, error } = await admin()
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('[storefront/booking] getBookingForPayment:', error.message)
    return null
  }
  return data ? mapAppointmentRow(data) : null
}

/** A single treatment's hero photo, for the checkout reservation panel. */
export async function getTreatmentImageUrl(treatmentId: string): Promise<string | null> {
  const { data, error } = await admin()
    .from('treatments')
    .select('hero_image_url')
    .eq('id', treatmentId)
    .maybeSingle()
  if (error) {
    console.error('[storefront/booking] getTreatmentImageUrl:', error.message)
    return null
  }
  return data?.hero_image_url ?? null
}

/** Active guests in a managed group (service role). Returns [] for non-groups. */
export async function getGroupMembers(groupId: string): Promise<StaffAppointment[]> {
  const { data, error } = await admin()
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('group_id', groupId)
    .eq('group_management_active', true)
    .order('updated_at', { ascending: true })
  if (error) {
    console.error('[storefront/booking] getGroupMembers:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

/**
 * The single announcement to show on the public banner right now (nearest
 * active/upcoming closure, else newest message), or null. Read via a lightly-
 * cached, tagged client so the public layout stays ISR-friendly; staff actions
 * bust it instantly with revalidateTag('announcements').
 */
export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const cached = createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 300, tags: ['announcements'] } }) },
    },
  )
  const { data, error } = await cached
    .from('announcements')
    .select('id, kind, message, start_date, end_date, block_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[storefront/booking] getActiveAnnouncement:', error.message)
    return null
  }
  return pickActive((data ?? []).map(mapAnnouncementRow), mytTodayYMD())
}

/** A signed-in customer's own bookings (RLS-scoped client). */
export async function getMyBookings(sb: SB, userId: string): Promise<StaffAppointment[]> {
  const { data, error } = await sb
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('customer_id', userId)
    .order('updated_at', { ascending: false })
  if (error) {
    console.error('[storefront/booking] getMyBookings:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}
