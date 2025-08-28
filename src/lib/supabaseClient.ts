import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
// These environment variables need to be set in a .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate that required environment variables are present
// This helps catch configuration issues early with clear error messages
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

// Create and export the Supabase client instance
// This client will be used throughout your app to interact with Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Also export as default for flexibility
export default supabase
