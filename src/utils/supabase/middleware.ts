import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login'
  const isCron = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`

  // If public assets or auth route, let it pass (unless logged in and visiting login)
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico') ||
    pathname.startsWith('/api/auth')
  ) {
    return supabaseResponse
  }

  // Define role
  const role = user?.user_metadata?.role || 'member' // Default to member if no role

  if (isAuthRoute) {
    if (user) {
      // Redirect to dashboard if already logged in
      return NextResponse.redirect(new URL('/nutcracker', request.url))
    }
    return supabaseResponse
  }

  // Redirect root to dashboard
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/nutcracker", request.url));
  }

  // Dashboard protection
  if (pathname.startsWith("/nutcracker")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse
  }

  // Admin routes protection (scraper UI)
  if (pathname.startsWith("/admin")) {
    if (!user || role !== "admin") {
      return NextResponse.redirect(new URL("/nutcracker", request.url));
    }
    return supabaseResponse
  }

  // API protection
  if (pathname.startsWith("/api/events") || pathname.startsWith("/api/monitor")) {
    if (!isCron && (!user || role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }
    return supabaseResponse
  }

  return supabaseResponse
}
