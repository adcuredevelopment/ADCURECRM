import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/database.types'

/**
 * Creates a Supabase client for use in server components and API routes.
 * Reads/writes cookies from the Next.js request.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from Server Component - can be ignored
            // if middleware is refreshing user sessions
          }
        },
      },
    }
  )
}
