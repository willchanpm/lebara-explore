import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
// These environment variables need to be set in a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate that required environment variables are present
// This helps catch configuration issues early with clear error messages
if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please create a .env.local file with your Supabase project URL.'
  )
}

if (!supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please create a .env.local file with your Supabase service role key or anonymous key.'
  )
}

// Create and export the Supabase server client instance
// This client will be used in server components and API routes to interact with Supabase
export const createServerClient = () => createClient(supabaseUrl, supabaseServiceKey)

// Also export as default for flexibility
export default createServerClient
