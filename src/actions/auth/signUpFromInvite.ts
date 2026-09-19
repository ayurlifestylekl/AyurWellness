'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Brand-Partner sign-up via admin-issued invite token.
 *
 * Flow:
 *   1. Validate the token by SELECT on agent_invites (RLS allows public
 *      read of un-used, un-expired invites)
 *   2. Create auth.users with the invite's email → on_auth_user_created
 *      trigger inserts public.users (default role='customer' initially)
 *   3. Call the SECURITY DEFINER RPC `claim_agent_invite(token, user_id)`
 *      which atomically: promotes role to 'sales_agent', creates the
 *      sales_agents row with locked-in commission terms, and marks the
 *      invite consumed. Row-level FOR UPDATE lock blocks concurrent claims.
 */
export async function signUpFromInvite(
  token: string,
  password: string
): Promise<AuthResult> {
  const cleanToken = token.trim()
  if (!cleanToken || cleanToken.length < 5) {
    return { ok: false, error: 'This invite link is invalid.' }
  }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  // 1. Fetch the live invite
  const { data: inviteRaw, error: inviteError } = await supabase
    .from('agent_invites')
    .select('email, full_name, expires_at, used_at')
    .eq('token', cleanToken)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (inviteError) {
    console.error('[auth/invite] lookup failed:', inviteError.message)
    return { ok: false, error: 'Could not verify your invite. Please try again.' }
  }

  // Cast: hand-maintained Database type predates Supabase v2 inference metadata.
  const invite = inviteRaw as
    | { email: string; full_name: string; expires_at: string; used_at: string | null }
    | null

  if (!invite) {
    return { ok: false, error: 'This invite link is invalid or has expired. Please contact the team for a new one.' }
  }
  if (!EMAIL_RE.test(invite.email)) {
    return { ok: false, error: 'Invite has an invalid email — please contact admin.' }
  }

  // 2. Create the auth user with the invite's email + full_name
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password,
    options: {
      data: { full_name: invite.full_name },
    },
  })

  if (signUpError || !signUpData.user) {
    console.error('[auth/invite] signUp failed:', signUpError?.message)
    const isExisting = /already|registered|exists/i.test(signUpError?.message ?? '')
    return {
      ok: false,
      error: isExisting
        ? 'An account already exists for this email. Please sign in instead.'
        : 'Could not create your account. Please try again.',
    }
  }

  // 3. Atomic role promotion + sales_agents insert + invite consumption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcError } = await (supabase.rpc as any)('claim_agent_invite', {
    p_token: cleanToken,
    p_user_id: signUpData.user.id,
  })

  if (rpcError) {
    console.error('[auth/invite] claim_agent_invite RPC failed:', rpcError.message)
    return {
      ok: false,
      error: "Account created but partner setup failed. Please contact us — we'll fix it manually.",
    }
  }

  // If email confirmation is required, redirect to login with notice
  if (signUpData.user && !signUpData.session) {
    return { ok: true, redirectTo: '/auth/login?confirmation=sent' }
  }

  return { ok: true, redirectTo: '/agent/dashboard' }
}
