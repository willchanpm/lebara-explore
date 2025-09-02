import { createBrowserClient } from '@supabase/ssr'

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
 * Creates a browser-side Supabase client
 * Note: Authentication tokens are managed via HttpOnly cookies by the server helper
 * Do not use localStorage for token storage - use the server-side createSupabaseServer instead
 */
export function createSupabaseBrowser() {
  // Create and return the browser-side Supabase client
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
