"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Server-side Supabase client for server components and route handlers
 * IMPORTANT: Never store this in a global variable (Fluid compute issue)
 * Always create a new client within each function
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          // Don't throw on abort, just let it fail silently
          signal: options?.signal,
        }).catch((error) => {
          if (error.name === "AbortError") {
            // Return an empty response for aborted requests
            return new Response(JSON.stringify({ data: null, error: null }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          }
          throw error
        })
      },
    },
  })
}

export { createClient as createServerClient }
