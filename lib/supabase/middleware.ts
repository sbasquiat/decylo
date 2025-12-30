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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Refresh session first to ensure we have the latest auth state
  // This prevents stale session data from being used
  // Wrap in try-catch to prevent errors from breaking middleware
  try {
    await supabase.auth.getSession()
  } catch (error) {
    console.error('Middleware: Error refreshing session', error)
    // Continue anyway - getUser will handle auth state
  }
  
  // Get user from refreshed session - this ensures cookies are updated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  // Log auth errors for debugging
  if (userError) {
    console.error('Middleware: Error getting user', userError)
  }

  const pathname = request.nextUrl.pathname

  // If user is authenticated and trying to access auth pages, redirect to app
  if (user && (pathname === '/signin' || pathname === '/signup' || pathname === '/forgot-password')) {
    const url = request.nextUrl.clone()
    // Preserve returnTo if it exists
    const returnTo = url.searchParams.get('returnTo')
    url.pathname = returnTo || '/app'
    url.searchParams.delete('returnTo')
    return NextResponse.redirect(url)
  }

  // Optional: Redirect authenticated users from / to /app
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  // If user is NOT authenticated and trying to access protected routes (/app/*)
  if (!user && pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(url)
  }

  // Allow access to auth routes for unauthenticated users
  // (signin, signup, forgot-password are handled by auth layout)

  // Allow access to public routes
  return supabaseResponse
}

