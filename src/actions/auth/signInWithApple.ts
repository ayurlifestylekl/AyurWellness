'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

type Result =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Initiates the Apple Sign-In handshake. Mirrors signInWithGoogle.
 * The Apple provider must be enabled in Supabase Dashboard → Auth →
 * Providers → Apple (Service ID + Team ID + Key ID + .p8 private key).
 */
export async function signInWithApple(nextPath?: string): Promise<Result> {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const callbackUrl = new URL('/auth/callback', `${proto}://${host}`)
  if (nextPath) callbackUrl.searchParams.set('next', nextPath)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: callbackUrl.toString() },
  })

  if (error || !data?.url) {
    console.error('[auth/apple] init failed:', error?.message)
    return { ok: false, error: 'Could not start Apple sign-in. Please try another method.' }
  }

  return { ok: true, url: data.url }
}
