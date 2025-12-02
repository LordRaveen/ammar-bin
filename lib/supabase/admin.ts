import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client with service role key
 * ONLY use for server-side admin operations that require elevated privileges
 * Never expose this to the client side
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
