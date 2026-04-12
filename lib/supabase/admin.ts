import { createClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database.types'

/**
 * Creates a Supabase client with service role key.
 * Bypasses RLS — use ONLY in server-side admin API routes.
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
