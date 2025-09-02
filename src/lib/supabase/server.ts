import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate that required environment variables are present
if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please create a .env.local file with your Supabase project URL.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please create a .env.local file with your Supabase anonymous key.'
  )
}

/**
 * Creates a server-side Supabase client with custom cookie handling
 * This wrapper uses HttpOnly cookies to make iOS Safari persist sessions reliably
 * by using first-party HttpOnly cookies instead of localStorage
 */
export async function createSupabaseServer() {
  // Create a cookies adapter that handles cookie operations
  const cookieStore = await cookies()
  
  const cookiesAdapter = {
    // Get a cookie value by name
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    
    // Set a cookie with proper security options
    set(name: string, value: string, options: { maxAge?: number; expires?: Date } = {}) {
      // Set cookie with security options for iOS Safari compatibility
      cookieStore.set(name, value, {
        httpOnly: true,        // Prevents JavaScript access (security)
        sameSite: 'lax',       // CSRF protection
        path: '/',             // Cookie available across entire site
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        ...options             // Allow custom maxAge/expires
      })
    },
    
    // Remove a cookie by setting immediate expiry
    remove(name: string) {
      // Clear cookie using same options and immediate expiry for iOS reliability
      cookieStore.set(name, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0)  // Immediate expiry to ensure iOS drops the cookie
      })
    }
  }

  // Create and return the server-side Supabase client
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookiesAdapter
  })
}
