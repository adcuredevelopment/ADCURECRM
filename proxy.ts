import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { type Database } from '@/types/database.types'

/**
 * Route protection middleware.
 *
 * Rules:
 * - Unauthenticated → redirect to /login
 * - Client role → can access /client/* only (redirected from /agency/*)
 * - Agency admin → can access /agency/* only (redirected from /client/*)
 * - Login page when authenticated → redirect to own dashboard
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Public routes that don't need auth
  const isPublicRoute = pathname === '/login' || pathname === '/'

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated, fetch role to enforce role-based routing
  if (user) {
    // Create a supabase client to fetch user role
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only in middleware role check
          },
        },
      }
    )

    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as { role: 'client' | 'agency_admin' } | null
    const role = profile?.role

    // Redirect authenticated users away from login page
    if (isPublicRoute && role) {
      const dashboardUrl = role === 'agency_admin'
        ? new URL('/agency/dashboard', request.url)
        : new URL('/client/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Prevent clients from accessing agency routes
    if (role === 'client' && pathname.startsWith('/agency')) {
      return NextResponse.redirect(new URL('/client/dashboard', request.url))
    }

    // Prevent agency admins from accessing client routes
    if (role === 'agency_admin' && pathname.startsWith('/client')) {
      return NextResponse.redirect(new URL('/agency/dashboard', request.url))
    }

    // Handle root redirect for authenticated users
    if (pathname === '/') {
      const dashboardUrl = role === 'agency_admin'
        ? new URL('/agency/dashboard', request.url)
        : new URL('/client/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
