import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { homeForRole, type UserRole } from '@/lib/auth/getCurrentUser'

/**
 * OAuth + email-confirmation callback.
 * Supabase appends `?code=...` after Google's consent screen and after
 * email-confirmation links. We exchange the code for a session, then
 * redirect to either ?next= or the user's role home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const errorParam = searchParams.get('error') || searchParams.get('error_description')

  if (errorParam) {
    console.error('[auth/callback] provider error:', errorParam)
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`)
  }

  // Look up role to know where to land
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const { data: profileRaw } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  const profile = profileRaw as { role: UserRole } | null
  const role: UserRole = profile?.role ?? 'customer'

  // Honor ?next= only if it's a same-origin internal path (security: never
  // redirect to external URLs from a query param).
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null

  return NextResponse.redirect(`${origin}${safeNext ?? homeForRole(role)}`)
}
