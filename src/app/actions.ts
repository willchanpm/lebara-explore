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

/**
 * Server action to load user profile by email
 * Returns profile data or null
 */
export async function loadProfileAction(email: string) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get user ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Error getting session:', sessionError)
      return { success: false, error: 'User not authenticated' }
    }
    
    // Verify the email matches the session user
    if (session.user.email !== email) {
      return { success: false, error: 'Email mismatch' }
    }
    
    // Fetch user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', session.user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', profileError)
      return { success: false, error: 'Failed to load profile data' }
    }
    
    return { 
      success: true, 
      data: {
        displayName: profileData?.display_name || ''
      }
    }
    
  } catch (error) {
    console.error('Load profile error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to save user profile display name
 * Returns success status
 */
export async function saveProfileAction(email: string, displayName: string) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get user ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Error getting session:', sessionError)
      return { success: false, error: 'User not authenticated' }
    }
    
    // Verify the email matches the session user
    if (session.user.email !== email) {
      return { success: false, error: 'Email mismatch' }
    }
    
    // Validate display name
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      return { success: false, error: 'Display name cannot be empty' }
    }
    
    if (trimmedName.length > 50) {
      return { success: false, error: 'Display name must be 50 characters or less' }
    }
    
    // Upsert profile with display name
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { 
          user_id: session.user.id, 
          display_name: trimmedName 
        },
        { 
          onConflict: 'user_id' 
        }
      )
    
    if (error) {
      console.error('Error saving profile:', error)
      return { success: false, error: 'Failed to save display name' }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Save profile error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Server action to save a bingo check-in
 * Returns success status and data
 */
export async function saveBingoCheckInAction(
  userEmail: string,
  tileId: string,
  boardMonth: string,
  comment: string,
  rating: number,
  photoUrl: string | null
) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get user ID from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Error getting session:', sessionError)
      return { success: false, error: 'User not authenticated' }
    }
    
    // Verify the email matches the session user
    if (session.user.email !== userEmail) {
      return { success: false, error: 'Email mismatch' }
    }
    
    // Get author name for the check-in
    let authorName = 'Member' // Default fallback
    
    try {
      // Use the provided userEmail to get email prefix
      const emailPrefix = userEmail.split('@')[0]
      
      // Look up profile for display name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', session.user.id)
        .single()
      
      // Compute author name: use display_name if available, otherwise email prefix
      authorName = (profileData?.display_name?.trim()?.length) 
        ? profileData.display_name.trim() 
        : emailPrefix
    } catch (error) {
      console.warn('Could not determine author name, using default:', error)
      // Keep default 'Member' if there's an error
    }
    
    // Insert check-in record
    const { data: checkInData, error: insertError } = await supabase
      .from('check_ins')
      .insert({
        user_id: session.user.id,
        tile_id: tileId,
        board_month: boardMonth,
        comment: comment.trim(),
        rating: Math.max(0, Math.min(5, rating)), // Clamp rating to 0-5 range
        photo_url: photoUrl,
        author_name: authorName
      })
      .select()
      .single()
    
    if (insertError) {
      // Check if it's a duplicate error
      if (insertError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Already completed this tile for this month' }
      }
      
      console.error('Database insert error:', insertError)
      return { success: false, error: 'Failed to save check-in' }
    }
    
    return { success: true, data: checkInData }
    
  } catch (error) {
    console.error('Save bingo check-in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
