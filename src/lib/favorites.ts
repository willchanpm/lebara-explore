import { SupabaseClient } from '@supabase/supabase-js'

// Interface for a favorite record
export interface Favorite {
  id: number
  user_id: string
  place_id: string
  created_at: string
}

// Interface for a place with favorite status
export interface PlaceWithFavorite {
  id: string
  name: string
  category: string
  slug: string
  maps_url: string
  is_favorited: boolean
}

/**
 * Toggle a place as favorite/unfavorite for the current user
 * @param supabase - Supabase client instance
 * @param userId - Current user's ID
 * @param placeId - ID of the place to toggle favorite status (can be string or number)
 * @returns Object with success status and optional error message
 */
export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  placeId: string | number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if userId is valid before making any queries
    if (!userId || userId.trim() === '') {
      console.warn('toggleFavorite called with empty userId')
      return { success: false, error: 'User not authenticated' }
    }

    // First check if this place is already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing favorite:', checkError)
      return { success: false, error: 'Failed to check favorite status' }
    }

    if (existingFavorite) {
      // Place is already favorited, so remove it
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id)

      if (deleteError) {
        console.error('Error removing favorite:', deleteError)
        return { success: false, error: 'Failed to remove favorite' }
      }

      return { success: true }
    } else {
      // Place is not favorited, so add it
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          place_id: placeId
        })

      if (insertError) {
        console.error('Error adding favorite:', insertError)
        return { success: false, error: 'Failed to add favorite' }
      }

      return { success: true }
    }
  } catch (error) {
    console.error('Unexpected error in toggleFavorite:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all favorites for a specific user
 * @param supabase - Supabase client instance
 * @param userId - User ID to get favorites for
 * @returns Object with array of favorited places or error message
 */
export async function getUserFavorites(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: PlaceWithFavorite[] | null; error?: string }> {
  try {
    // Check if userId is valid before making the query
    if (!userId || userId.trim() === '') {
      console.warn('getUserFavorites called with empty userId')
      return { data: [] }
    }

    // Join favorites with places table to get place details
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        place_id,
        created_at,
        places (
          id,
          name,
          category,
          slug,
          maps_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user favorites:', error)
      return { data: null, error: 'Failed to fetch favorites' }
    }

    if (!data) {
      return { data: [] }
    }

    // Transform the data to match our PlaceWithFavorite interface
    const favorites: PlaceWithFavorite[] = data.map(fav => {
      const placeData = fav.places as unknown as { id: string; name: string; category: string; slug: string; maps_url: string } // Type assertion for Supabase join
      return {
        id: placeData?.id || '',
        name: placeData?.name || '',
        category: placeData?.category || '',
        slug: placeData?.slug || '',
        maps_url: placeData?.maps_url || '',
        is_favorited: true
      }
    })

    return { data: favorites }
  } catch (error) {
    console.error('Unexpected error in getUserFavorites:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if a specific place is favorited by the current user
 * @param supabase - Supabase client instance
 * @param userId - Current user's ID
 * @param placeId - ID of the place to check (can be string or number)
 * @returns Object with boolean indicating if favorited and optional error message
 */
export async function isPlaceFavorited(
  supabase: SupabaseClient,
  userId: string,
  placeId: string | number
): Promise<{ isFavorited: boolean; error?: string }> {
  try {
    // Check if userId is valid before making any queries
    if (!userId || userId.trim() === '') {
      console.warn('isPlaceFavorited called with empty userId')
      return { isFavorited: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if place is favorited:', error)
      return { isFavorited: false, error: 'Failed to check favorite status' }
    }

    return { isFavorited: !!data }
  } catch (error) {
    console.error('Unexpected error in isPlaceFavorited:', error)
    return { isFavorited: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get favorite status for multiple places at once (for efficiency)
 * @param supabase - Supabase client instance
 * @param userId - Current user's ID
 * @param placeIds - Array of place IDs to check (can be strings or numbers)
 * @returns Object with Set of favorited place IDs or error message
 */
export async function getFavoriteStatusForPlaces(
  supabase: SupabaseClient,
  userId: string,
  placeIds: (string | number)[]
): Promise<{ data: Set<string> | null; error?: string }> {
  try {
    // Check if userId is valid before making any queries
    if (!userId || userId.trim() === '') {
      console.warn('getFavoriteStatusForPlaces called with empty userId')
      return { data: new Set() }
    }

    if (placeIds.length === 0) {
      return { data: new Set() }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('place_id')
      .eq('user_id', userId)
      .in('place_id', placeIds)

    if (error) {
      console.error('Error fetching favorite status for places:', error)
      return { data: null, error: 'Failed to fetch favorite status' }
    }

    const favoritedIds = new Set(data?.map(fav => fav.place_id) || [])
    return { data: favoritedIds }
  } catch (error) {
    console.error('Unexpected error in getFavoriteStatusForPlaces:', error)
    return { data: null, error: 'An unexpected error occurred' }
  }
}
