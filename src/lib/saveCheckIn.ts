import { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Interface for the check-in data
interface CheckInData {
  supabase: SupabaseClient
  userId: string
  userEmail: string | null
  tileId: string
  boardMonth: string
  comment: string
  rating: number
  file?: File | null
}

// Interface for the check-in record
interface CheckInRecord {
  id: string
  user_id: string
  tile_id: string
  board_month: string
  comment: string
  rating: number
  photo_url: string | null
  author_name: string | null
  created_at: string
}

// Helper to get current user ID - now requires userEmail parameter
export async function getCurrentUserId(supabase: SupabaseClient, userEmail: string | null): Promise<string> {
  if (!userEmail) {
    throw new Error('User not authenticated')
  }
  
  // We need to get the user ID from the email, but since we can't call getUser() in client components,
  // this function should be called from server components or server actions that have access to the user ID
  throw new Error('getCurrentUserId should be called from server components with user ID')
}

// Helper to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

// Main function to save a check-in
export async function saveCheckIn({
  supabase,
  userId,
  userEmail,
  tileId,
  boardMonth,
  comment,
  rating,
  file
}: CheckInData): Promise<{ data: CheckInRecord | null; error: string | null }> {
  try {
    // Check if user is authenticated
    if (!userEmail) {
      return { data: null, error: 'User not authenticated' }
    }
    
    // Clamp rating to 0-5 range
    const clampedRating = Math.max(0, Math.min(5, rating))
    
    let photoUrl: string | null = null
    
    // Upload file if provided
    if (file) {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const sanitizedOriginalName = sanitizeFilename(file.name.replace(`.${fileExtension}`, ''))
      const uniqueId = uuidv4()
      const filename = `${uniqueId}-${sanitizedOriginalName}.${fileExtension}`
      
      // Build storage path
      const storagePath = `checkins/${userId}/${boardMonth}/${filename}`
      
      // Upload file to Storage
      const { error: uploadError } = await supabase.storage
        .from('checkins')
        .upload(storagePath, file, {
          upsert: false,
          cacheControl: '3600' // 1 hour cache
        })
      
      if (uploadError) {
        console.error('File upload error:', uploadError)
        return { data: null, error: 'Failed to upload photo' }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('checkins')
        .getPublicUrl(storagePath)
      
      photoUrl = urlData.publicUrl
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
        .eq('user_id', userId)
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
        user_id: userId,
        tile_id: tileId,
        board_month: boardMonth,
        comment: comment.trim(),
        rating: clampedRating,
        photo_url: photoUrl,
        author_name: authorName
      })
      .select()
      .single()
    
    if (insertError) {
      // Check if it's a duplicate error
      if (insertError.code === '23505') { // Unique constraint violation
        return { data: null, error: 'Already completed this tile for this month' }
      }
      
      console.error('Database insert error:', insertError)
      return { data: null, error: 'Failed to save check-in' }
    }
    
    return { data: checkInData, error: null }
    
  } catch (error) {
    console.error('Unexpected error in saveCheckIn:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
