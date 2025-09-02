'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

/**
 * Server action to verify OTP and sign in user
 * This runs on the server and performs a server-side redirect after successful verification
 */
export async function verifyOtpAction(email: string, token: string) {
  try {
    // Create a Supabase server client
    const supabase = await createSupabaseServer()
    
    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token,
      type: 'email'
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    if (!data.user) {
      return { success: false, error: 'Authentication failed - no user data received' }
    }
    
    // Success! User is now authenticated
    // The server-side redirect will happen automatically
    // The cookies are managed by the server helper
    redirect('/')
    
  } catch (error) {
    console.error('OTP verification error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to sign out user
 * This runs on the server, clears the session, and redirects to login
 */
export async function signOutAction() {
  try {
    // Create a Supabase server client
    const supabase = await createSupabaseServer()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, we'll redirect to login
    }
    
    // Always redirect to login after sign out
    // The server helper will clear the cookies with proper options
    redirect('/login')
    
  } catch (error) {
    console.error('Sign out error:', error)
    // Even if there's an error, redirect to login
    redirect('/login')
  }
}

/**
 * Server action to check if user is authenticated
 * Returns user data or null
 */
export async function getCurrentUserAction() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
