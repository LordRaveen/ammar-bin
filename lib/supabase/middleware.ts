import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Session refresh middleware for Supabase auth
 * This prevents session loss by refreshing tokens on every request
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  // Create a new Supabase client for this request
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const isSignInPage = request.nextUrl.pathname === "/auth/signin"
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isPublicPage = request.nextUrl.pathname === "/"

  if (isAuthPage) {
    return supabaseResponse
  }

  // Instead of calling getUser(), check if auth cookies exist
  const authCookies = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"))
  const hasSession = authCookies.length > 0

  // Protected routes - redirect to sign in if not authenticated
  if (!hasSession && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/signin"
    return NextResponse.redirect(url)
  }

  // If user has session and tries to access home page, redirect to dashboard
  if (hasSession && isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
