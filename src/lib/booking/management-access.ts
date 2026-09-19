import 'server-only'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { hashManagementValue } from './guest-recovery'
import { verifyBookingToken } from './token'

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

async function activeGrant(token: string | null | undefined, appointmentId?: string): Promise<boolean> {
  if (!token) return false
  let query = admin()
    .from('booking_management_grants')
    .select('id')
    .eq('token_hash', hashManagementValue(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
  if (appointmentId) query = query.contains('appointment_ids', [appointmentId])
  const { data, error } = await query.maybeSingle()
  return !error && !!data
}

export async function hasActiveManagementGrant(token: string | null | undefined): Promise<boolean> {
  return activeGrant(token)
}

async function signedInUserId(): Promise<string | null> {
  const session = await createSessionClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  return user?.id ?? null
}

export async function canManageBooking(
  id: string,
  customerId: string | null,
  token: string | null | undefined,
): Promise<boolean> {
  if (verifyBookingToken(id, token)) return true
  if (await activeGrant(token, id)) return true
  if (!customerId) return false
  return (await signedInUserId()) === customerId
}

export async function canManageBookingTarget(
  anchorId: string,
  targetId: string,
  token: string | null | undefined,
): Promise<boolean> {
  if (anchorId === targetId && verifyBookingToken(anchorId, token)) return true
  if (await activeGrant(token, targetId)) return true

  const sb = admin()
  const { data: rows, error } = await sb
    .from('appointments')
    .select('id, customer_id, group_id')
    .in('id', anchorId === targetId ? [anchorId] : [anchorId, targetId])

  if (error) return false
  const anchor = rows?.find((row) => row.id === anchorId)
  const target = rows?.find((row) => row.id === targetId)
  if (!anchor || !target) return false

  if (verifyBookingToken(anchorId, token)) {
    if (anchorId === targetId) return true
    return !!anchor.group_id && anchor.group_id === target.group_id
  }

  return !!target.customer_id && (await signedInUserId()) === target.customer_id
}
