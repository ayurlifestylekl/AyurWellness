import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'admin' | 'customer' | 'sales_agent' | 'doctor' | 'front_desk'

function homeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'sales_agent':
      return '/agent/dashboard'
    case 'doctor':
      return '/doctor'
    case 'front_desk':
      return '/console'
    case 'customer':
    default:
      return '/account/dashboard'
  }
}

/** Pages that are finished enough to be public on the preview deploy. */
const PUBLIC_PREVIEW_ROUTES = ['/', '/about', '/contact']

/**
 * Preview-deploy gate: set HOMEPAGE_ONLY=true in Vercel's env vars to make
 * everything except the routes above (and Next's own internals/api) redirect
 * to home. Runs before the Supabase client is created, so it works even
 * without any Supabase/Sanity credentials configured. Remove the env var
 * (no code change needed) once the rest of the site is ready to go live.
 */
function homepageOnlyGate(request: NextRequest): NextResponse | null {
  if (process.env.HOMEPAGE_ONLY !== 'true') return null
  const { pathname } = request.nextUrl
  if (PUBLIC_PREVIEW_ROUTES.includes(pathname)) return null
  if (pathname.startsWith('/api/')) return null
  const home = request.nextUrl.clone()
  home.pathname = '/'
  home.search = ''
  return NextResponse.redirect(home)
}

export async function middleware(request: NextRequest) {
  const gated = homepageOnlyGate(request)
  if (gated) return gated

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // No Supabase project wired up yet → there are no sessions to read and no
  // portals to gate, so skip auth entirely. Without this, createServerClient
  // throws "supabaseUrl is required" on *every* request (middleware runs on
  // all matched paths, including "/"), which surfaces as a hard 500
  // MIDDLEWARE_INVOCATION_FAILED rather than a degraded page.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and
  // supabase.auth.getUser(). Doing so invalidates the session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAccountRoute = pathname.startsWith('/account')

  // /admin/login and /agent/login are PUBLIC sign-in pages (not protected).
  // Only the dashboard parts (under the (portal) route group) are role-gated.
  const isAdminLogin = pathname === '/admin/login'
  const isAgentLogin = pathname === '/agent/login'
  const isStaffLogin = pathname === '/staff/login'
  const isDoctorLogin = pathname === '/doctor/login'
  const isAdminRoute = pathname.startsWith('/admin') && !isAdminLogin
  const isAgentRoute = pathname.startsWith('/agent') && !isAgentLogin
  // Front-desk + admin share the /console workspace; doctors get /doctor.
  const isConsoleRoute = pathname.startsWith('/console')
  const isDoctorRoute = pathname.startsWith('/doctor') && !isDoctorLogin
  const isProtectedRoute =
    isAccountRoute || isAdminRoute || isAgentRoute || isConsoleRoute || isDoctorRoute

  // Auth pages that signed-in users should be bounced away from.
  // We DO NOT bounce away from /auth/callback (mid-OAuth handshake) or
  // /auth/reset-password (user is signed in via a recovery session here).
  const isBouncableAuthPage =
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/forgot-password' ||
    isAdminLogin ||
    isAgentLogin ||
    isStaffLogin ||
    isDoctorLogin

  // ── Not signed in → send to the portal-specific login page ──────────────
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = isAdminRoute
      ? '/admin/login'
      : isAgentRoute
      ? '/agent/login'
      : isDoctorRoute
      ? '/doctor/login'
      : isConsoleRoute
      ? '/staff/login'
      : '/auth/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Signed in → role gating ──────────────────────────────────────────────
  if (user && (isProtectedRoute || isBouncableAuthPage)) {
    const { data: profileRaw } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { role: UserRole } | null
    const role = profile?.role ?? null

    // Bounce already-signed-in users off the auth pages → their home
    if (isBouncableAuthPage) {
      const home = request.nextUrl.clone()
      home.pathname = homeForRole(role)
      home.search = ''
      return NextResponse.redirect(home)
    }

    // Role mismatch on any portal route → redirect to the user's own home.
    // Cleaner UX than 404; access decision is invisible to the wrong-role user.
    const wrongRoleForAdmin = isAdminRoute && role !== 'admin'
    const wrongRoleForAgent = isAgentRoute && role !== 'sales_agent'
    const wrongRoleForAccount = isAccountRoute && role !== 'customer'
    // /console = admin + front desk; /doctor = doctor + admin.
    const wrongRoleForConsole =
      isConsoleRoute && role !== 'admin' && role !== 'front_desk'
    const wrongRoleForDoctor =
      isDoctorRoute && role !== 'admin' && role !== 'doctor'
    if (
      wrongRoleForAdmin ||
      wrongRoleForAgent ||
      wrongRoleForAccount ||
      wrongRoleForConsole ||
      wrongRoleForDoctor
    ) {
      const home = request.nextUrl.clone()
      home.pathname = homeForRole(role)
      home.search = ''
      return NextResponse.redirect(home)
    }
  }

  // ── Brand Partner referral tracking ──────────────────────────────────────
  // Capture ?ref=PARTNER_CODE from any page → 7-day cookie. Used at checkout
  // to populate orders.referral_agent_id.
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode) {
    supabaseResponse.cookies.set('referral_code', refCode, {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/',
      httpOnly: false, // readable by the checkout client
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
