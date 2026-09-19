'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

type Result =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Initiates the Google OAuth handshake. Returns the URL the caller should
 * redirect the browser to. After Google → Supabase finishes, the user lands
 * back on /auth/callback which exchanges the code and routes to the right
 * dashboard.
 *
 * The Supabase project must have Google enabled in Auth → Providers, and
 * the callback URL (https://<project>.supabase.co/auth/v1/callback) must
 * be in Google Cloud Console's authorized redirect URIs.
 */
export async function signInWithGoogle(nextPath?: string): Promise<Result> {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const callbackUrl = new URL('/auth/callback', `${proto}://${host}`)
  if (nextPath) callbackUrl.searchParams.set('next', nextPath)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callbackUrl.toString() },
  })

  if (error || !data?.url) {
    console.error('[auth/google] init failed:', error?.message)
    return { ok: false, error: 'Could not start Google sign-in. Please try again.' }
  }

  return { ok: true, url: data.url }
}
