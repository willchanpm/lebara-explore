import { SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Interface for the check-in data
interface CheckInData {
  supabase: SupabaseClient
  userId: string
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
  is_reset: boolean
}

// Helper to get current user ID
export async function getCurrentUserId(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return user.id
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
  tileId,
  boardMonth,
  comment,
  rating,
  file
}: CheckInData): Promise<{ data: CheckInRecord | null; error: string | null }> {
  try {
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
      // Get current user to access email
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const emailPrefix = user.email.split('@')[0]
        
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
      }
    } catch (error) {
      console.warn('Could not determine author name, using default:', error)
      // Keep default 'Member' if there's an error
    }
    
    // Check if an active record already exists for this user/tile/month
    const { data: existingActiveRecord } = await supabase
      .from('check_ins')
      .select('id, is_reset')
      .eq('user_id', userId)
      .eq('tile_id', tileId)
      .eq('board_month', boardMonth)
      .eq('is_reset', false) // Only check for active records
      .single()
    
    let checkInData: CheckInRecord | null = null
    let insertError: Error | null = null
    
    if (existingActiveRecord) {
      // Active record exists - update it with new data
      console.log('Updating existing active record:', existingActiveRecord.id)
      const { data: updateData, error: updateError } = await supabase
        .from('check_ins')
        .update({
          comment: comment.trim(),
          rating: clampedRating,
          photo_url: photoUrl,
          author_name: authorName,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('id', existingActiveRecord.id)
        .select()
        .single()
      
      checkInData = updateData
      insertError = updateError
    } else {
      // No active record exists - insert new one
      // This allows multiple records per user/tile/month (one active, others reset)
      console.log('Inserting new record')
      const { data: insertData, error: insertErr } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          tile_id: tileId,
          board_month: boardMonth,
          comment: comment.trim(),
          rating: clampedRating,
          photo_url: photoUrl,
          author_name: authorName,
          is_reset: false
        })
        .select()
        .single()
      
      checkInData = insertData
      insertError = insertErr
    }
    
    if (insertError) {
      console.error('Database operation error:', insertError)
      return { data: null, error: 'Failed to save check-in' }
    }
    
    return { data: checkInData, error: null }
    
  } catch (error) {
    console.error('Unexpected error in saveCheckIn:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
