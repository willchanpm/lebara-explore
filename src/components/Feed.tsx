'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import ImageModal from './ImageModal'
import Toast from './Toast'
import { toggleFavorite, getFavoriteStatusForPlaces } from '@/lib/favorites'

// Interface for check-in data from the database
interface CheckIn {
  id: string
  user_id: string
  tile_id: string
  board_month: string
  comment: string
  rating: number
  photo_url: string | null
  author_name: string | null
  created_at: string
  tile_label?: string
  tile_description?: string | null
  place_id?: string // Add place_id for favorites functionality
  place_name?: string // Add place name for display
  place_category?: string // Add place category for display
}

// Interface for delete confirmation modal state
interface DeleteModalState {
  isOpen: boolean
  checkIn: CheckIn | null
}


// Helper function to format date and time
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '')
}

// Helper function to format month names (YYYY-MM to readable format)
function formatMonthName(monthString: string): string {
  if (monthString === 'all') return 'All months'
  
  try {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return monthString // Fallback to original string if parsing fails
  }
}

// Helper function to convert tile_id to readable title
function getTileTitle(checkIn: CheckIn): string {
  // First check if we have enhanced tile data from the database
  if (checkIn.tile_label && checkIn.tile_description) {
    return `${checkIn.tile_label}: ${checkIn.tile_description}`
  } else if (checkIn.tile_label) {
    return checkIn.tile_label
  } else if (checkIn.tile_description) {
    return checkIn.tile_description
  }
  
  // If no tile data available, convert the tile_id to a readable title
  return checkIn.tile_id
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper function to get author name with fallbacks
function getAuthorName(checkIn: CheckIn, currentUser: User | null): string {
  // If author_name is present, use it
  if (checkIn.author_name?.trim()) {
    return checkIn.author_name.trim()
  }
  
  // For current user's own posts, try to get email prefix
  if (currentUser && checkIn.user_id === currentUser.id && currentUser.email) {
    const emailPrefix = currentUser.email.split('@')[0]
    return emailPrefix
  }
  
  // Default fallback
  return 'Lebara member'
}

// Helper function to render star rating
function renderStars(rating: number): React.ReactElement[] {
  const stars = []
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span 
        key={i} 
        className={`star ${i < rating ? 'filled' : 'empty'}`}
        aria-label={i < rating ? 'Filled star' : 'Empty star'}
      >
        ★
      </span>
    )
  }
  return stars
}

export default function Feed() {
  // State for check-ins data
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [showMyPosts, setShowMyPosts] = useState(false)
  
  // State for current user
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // State for available months (for filter dropdown)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  
  // State for image modal
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    imageUrl: string
    imageAlt: string
  }>({
    isOpen: false,
    imageUrl: '',
    imageAlt: ''
  })

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    checkIn: null
  })

  // State for toast notifications
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  // State for favorites functionality
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error fetching user:', error)
        } else {
          setCurrentUser(user)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      }
    }
    
    getCurrentUser()
  }, [])

  // Fetch initial check-ins
  useEffect(() => {
    fetchCheckIns()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user favorites when user changes or check-ins change
  useEffect(() => {
    if (currentUser && checkIns.length > 0) {
      fetchUserFavorites()
    }
  }, [currentUser, checkIns]) // eslint-disable-line react-hooks/exhaustive-deps



  // Function to fetch check-ins from Supabase
  const fetchCheckIns = async (isLoadMore = false) => {
    try {
      setError(null)
      
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      // Build the query with manual join to bingo_tiles
      let query = supabase
        .from('check_ins')
        .select(`
          id, user_id, tile_id, board_month, comment, rating, 
          photo_url, author_name, created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      // Apply cursor pagination for load more
      if (isLoadMore && checkIns.length > 0) {
        const lastCheckIn = checkIns[checkIns.length - 1]
        query = query.lt('created_at', lastCheckIn.created_at)
      }

      // Apply filters
      if (selectedMonth !== 'all') {
        query = query.eq('board_month', selectedMonth)
      }
      
      if (showMyPosts && currentUser) {
        query = query.eq('user_id', currentUser.id)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (data) {
        // Enhance check-ins with tile data
        const enhancedData = await enhanceCheckInsWithTileData(data)
        
        if (isLoadMore) {
          setCheckIns(prev => [...prev, ...enhancedData])
        } else {
          setCheckIns(enhancedData)
        }
        
        // Check if we have more results
        setHasMore(data.length === 20)
        
        // Extract unique months for filter dropdown
        const months = [...new Set(data.map(checkIn => checkIn.board_month))]
        setAvailableMonths(months)
        
        // Refresh favorites after check-ins are loaded
        if (currentUser) {
          fetchUserFavorites()
        }
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err)
      setError('Failed to load check-ins. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Function to fetch user favorites
  const fetchUserFavorites = async () => {
    if (!currentUser) return
    
    try {
      setFavoritesLoading(true)
      
      // Get all place IDs from check-ins to check favorite status
      const placeIds = checkIns
        .map(checkIn => checkIn.place_id)
        .filter(Boolean) as string[]
      
      if (placeIds.length === 0) return
      
      const { data: favoritedIds, error } = await getFavoriteStatusForPlaces(
        supabase,
        currentUser.id,
        placeIds
      )
      
      if (error) {
        console.error('Error fetching favorite status:', error)
        return
      }
      
      if (favoritedIds) {
        setUserFavorites(favoritedIds)
      }
    } catch (err) {
      console.error('Error fetching user favorites:', err)
    } finally {
      setFavoritesLoading(false)
    }
  }

  // Function to handle favorite toggle
  const handleFavoriteToggle = async (placeId: string) => {
    if (!currentUser || !placeId) return
    
    try {
      const { success, error } = await toggleFavorite(
        supabase,
        currentUser.id,
        placeId
      )
      
      if (success) {
        // Update local state
        setUserFavorites(prev => {
          const newFavorites = new Set(prev)
          if (newFavorites.has(placeId)) {
            newFavorites.delete(placeId)
          } else {
            newFavorites.add(placeId)
          }
          return newFavorites
        })
        
        // Show success toast
        const isFavorited = userFavorites.has(placeId)
        showToast(
          isFavorited ? 'Removed from favorites' : 'Added to favorites',
          'success'
        )
      } else {
        showToast(error || 'Failed to update favorite', 'error')
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      showToast('Failed to update favorite', 'error')
    }
  }

  // Function to fetch tile data and enhance check-ins
  const enhanceCheckInsWithTileData = async (checkInsData: CheckIn[]) => {
    try {
      // Get unique tile IDs from check-ins
      const tileIds = [...new Set(checkInsData.map(checkIn => checkIn.tile_id))]
      
      if (tileIds.length === 0) return checkInsData
      
      // Fetch tile data from bingo_tiles table with place information
      const { data: tilesData, error: tilesError } = await supabase
        .from('bingo_tiles')
        .select(`
          id, 
          label, 
          description,
          place_id,
          places (
            id,
            name,
            category
          )
        `)
        .in('id', tileIds)
      
      if (tilesError) {
        console.error('Error fetching tile data:', tilesError)
        return checkInsData
      }
      
      // Create a map of tile_id to tile data
      const tileMap = new Map()
      tilesData?.forEach(tile => {
        tileMap.set(tile.id, tile)
      })
      
      // Enhance check-ins with tile data and place information
      return checkInsData.map(checkIn => {
        const tileData = tileMap.get(checkIn.tile_id)
        return {
          ...checkIn,
          tile_label: tileData?.label || null,
          tile_description: tileData?.description || null,
          place_id: tileData?.place_id || null,
          place_name: tileData?.places?.name || null,
          place_category: tileData?.places?.category || null
        }
      })
    } catch (err) {
      console.error('Error enhancing check-ins with tile data:', err)
      return checkInsData
    }
  }

  // Function to load more check-ins
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCheckIns(true)
    }
  }


  
  // Function to filter existing check-ins for "My posts only" without refetching
  const filterMyPosts = (checkInsData: CheckIn[]) => {
    if (!showMyPosts || !currentUser) {
      return checkInsData
    }
    return checkInsData.filter(checkIn => checkIn.user_id === currentUser.id)
  }
  
  // Function to open image modal
  const openImageModal = (imageUrl: string, imageAlt: string) => {
    setImageModal({
      isOpen: true,
      imageUrl,
      imageAlt
    })
  }
  
  // Function to close image modal
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      imageAlt: ''
    })
  }

  // Function to open delete confirmation modal
  const openDeleteModal = (checkIn: CheckIn) => {
    setDeleteModal({ isOpen: true, checkIn })
  }

  // Function to close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, checkIn: null })
  }

  // Function to handle successful deletion
  const handleDeleteSuccess = () => {
    closeDeleteModal()
    // Use setTimeout to ensure the modal closes before showing toast
    setTimeout(() => {
      showToast('Check-in deleted successfully!', 'success')
    }, 100)
    // No need to refetch since we already updated local state
  }

  // Function to handle deletion error
  const handleDeleteError = (error: string) => {
    closeDeleteModal()
    // Use setTimeout to ensure the modal closes before showing toast
    setTimeout(() => {
      showToast(`Error deleting check-in: ${error}`, 'error')
    }, 100)
  }

  // Function to delete a check-in
  const deleteCheckIn = async () => {
    if (!deleteModal.checkIn || !currentUser) return

    try {
      // First, delete the photo from storage if it exists
      if (deleteModal.checkIn.photo_url) {
        try {
          // Extract the storage path from the photo URL
          const storagePath = extractStoragePath(deleteModal.checkIn.photo_url)
          if (storagePath) {
            // Remove the photo from Supabase Storage
            const { error: storageError } = await supabase.storage
              .from('checkins')
              .remove([storagePath])
            
            if (storageError) {
              console.warn('Warning: Could not delete photo from storage:', storageError)
              // Continue with database deletion even if photo deletion fails
            }
          }
        } catch (storageErr) {
          console.warn('Warning: Error processing photo deletion:', storageErr)
          // Continue with database deletion even if photo deletion fails
        }
      }

      // Delete the check-in record from the database
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', deleteModal.checkIn.id)
        .eq('user_id', currentUser.id)

      if (error) {
        throw error
      }

      // Remove the deleted check-in from local state
      setCheckIns(prev => prev.filter(checkIn => checkIn.id !== deleteModal.checkIn!.id))
      
      handleDeleteSuccess()
    } catch (err) {
      console.error('Error deleting check-in:', err)
      handleDeleteError('Failed to delete check-in. Please try again.')
    }
  }

  // Function to extract storage path from photo_url
  const extractStoragePath = (photoUrl: string | null): string | null => {
    if (!photoUrl) return null
    
    try {
      // Supabase storage URLs typically look like:
      // https://[project].supabase.co/storage/v1/object/public/checkins/[path]
      const url = new URL(photoUrl)
      
      // Find the 'checkins' part and extract everything after it
      const checkinsIndex = url.pathname.indexOf('/checkins/')
      if (checkinsIndex !== -1) {
        // Extract the path after '/checkins/' (e.g., "userId/boardMonth/filename")
        return url.pathname.substring(checkinsIndex + 10) // +10 to skip '/checkins/'
      }
      
      // Fallback: try to extract just the filename from the end
      const pathParts = url.pathname.split('/')
      const filename = pathParts[pathParts.length - 1]
      if (filename && filename.includes('-')) {
        return filename
      }
      
      return null
    } catch (error) {
      console.warn('Could not parse photo URL:', photoUrl, error)
      return null
    }
  }

  // Function to show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }

  // Function to close toast
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }


  // If user is not authenticated, show sign-in CTA
  if (!currentUser) {
    return (
      <div className="feed-signin-cta">
        <div className="feed-signin-content">
          <div className="feed-signin-icon">🔐</div>
          <h3 className="feed-signin-title">Sign in to view the feed</h3>
          <p className="feed-signin-text">
            Join the community to see check-ins from other food explorers!
          </p>
          <a href="/login" className="btn btn-primary">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="feed-skeleton">
        {[1, 2, 3].map(i => (
          <div key={i} className="feed-card feed-skeleton-card">
            <div className="feed-card-header">
              <div className="feed-skeleton-title"></div>
              <div className="feed-skeleton-date"></div>
            </div>
            <div className="feed-skeleton-stars"></div>
            <div className="feed-skeleton-comment"></div>
            <div className="feed-skeleton-photo"></div>
            <div className="feed-skeleton-chip"></div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="feed-error">
        <div className="feed-error-content">
          <div className="feed-error-icon">⚠️</div>
          <h3 className="feed-error-title">Something went wrong</h3>
          <p className="feed-error-text">{error}</p>
          <button onClick={() => fetchCheckIns()} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    )
  }



  return (
    <div className="feed-component">
      {/* Filters */}
      <div className="feed-filters">
        <div className="simple-month-filter">
          <label htmlFor="month-select">Month:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonthName(month)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="feed-filter-group">
          <div className="feed-filter-toggle">
            <span className="feed-filter-toggle-text">My posts only:</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={showMyPosts}
                onChange={(e) => setShowMyPosts(e.target.checked)}
                className="toggle-switch-input"
                id="my-posts-toggle"
              />
              <label htmlFor="my-posts-toggle" className="toggle-switch-label">
                <span className="toggle-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on state */}
      {loading ? (
        <div className="feed-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="feed-card feed-skeleton-card">
              <div className="feed-card-header">
                <div className="feed-skeleton-title"></div>
                <div className="feed-skeleton-date"></div>
              </div>
              <div className="feed-skeleton-stars"></div>
              <div className="feed-skeleton-comment"></div>
              <div className="feed-skeleton-photo"></div>
              <div className="feed-skeleton-chip"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="feed-error">
          <div className="feed-error-content">
            <div className="feed-error-icon">⚠️</div>
            <h3 className="feed-error-title">Something went wrong</h3>
            <p className="feed-error-text">{error}</p>
            <button onClick={() => fetchCheckIns()} className="btn btn-primary">
              Try again
            </button>
          </div>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-content">
            <div className="feed-empty-icon">🍽️</div>
            <h3 className="feed-empty-title">No check-ins yet</h3>
            <p className="feed-empty-text">
              Complete a bingo tile to add your first post to the feed!
            </p>
            <a href="/bingo" className="btn btn-primary">
              Start exploring
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Check-ins list */}
          <div className="feed-list">
        {filterMyPosts(checkIns).map((checkIn) => (
          <div key={checkIn.id} className="feed-card">
            {/* Card header with tile label, date, and favorite button */}
            <div className="feed-card-header">
              <div className="feed-card-title-section">
                <h3 className="feed-card-title">
                  {getTileTitle(checkIn)}
                </h3>
                <span className="feed-card-author" title={getAuthorName(checkIn, currentUser)}>
                  by {getAuthorName(checkIn, currentUser)}
                </span>
              </div>
              <div className="feed-card-header-right">
                <time className="feed-card-date" dateTime={checkIn.created_at}>
                  {formatDateTime(checkIn.created_at)}
                </time>
                {/* Favorite button - show for all users if place_id exists */}
                {checkIn.place_id && currentUser && (
                  <button
                    onClick={() => handleFavoriteToggle(checkIn.place_id!)}
                    className={`feed-card-favorite-btn ${userFavorites.has(checkIn.place_id!) ? 'favorited' : ''}`}
                    aria-label={userFavorites.has(checkIn.place_id!) ? 'Remove from favorites' : 'Add to favorites'}
                    title={userFavorites.has(checkIn.place_id!) ? 'Remove from favorites' : 'Add to favorites'}
                    disabled={favoritesLoading}
                  >
                    {userFavorites.has(checkIn.place_id!) ? '⭐' : '☆'}
                  </button>
                )}
              </div>
            </div>

            {/* Star rating */}
            <div className="feed-card-rating" aria-label={`Rating: ${checkIn.rating} out of 5 stars`}>
              {renderStars(checkIn.rating)}
            </div>

            {/* Comment */}
            {checkIn.comment && (
              <p className="feed-card-comment" title={checkIn.comment}>
                {checkIn.comment}
              </p>
            )}

            {/* Photo */}
            <div className="feed-card-photo">
              {checkIn.photo_url ? (
                <img
                  src={checkIn.photo_url}
                  alt={`${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`}
                  className="feed-card-image clickable"
                  loading="lazy"
                  onClick={() => openImageModal(checkIn.photo_url!, `${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openImageModal(checkIn.photo_url!, `${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`)
                    }
                  }}
                />
              ) : (
                <div className="feed-card-photo-placeholder">
                  <span className="feed-card-photo-icon">📷</span>
                </div>
              )}
            </div>

            {/* Board month chip and action buttons container */}
            <div className="feed-card-bottom">
              <div className="feed-card-chip">
                {checkIn.board_month}
              </div>
              <div className="feed-card-actions">
                {/* Favorite button - show for all users if place_id exists */}
                {checkIn.place_id && currentUser && (
                  <button
                    onClick={() => handleFavoriteToggle(checkIn.place_id!)}
                    className={`feed-card-favorite-btn ${userFavorites.has(checkIn.place_id!) ? 'favorited' : ''}`}
                    aria-label={userFavorites.has(checkIn.place_id!) ? 'Remove from favorites' : 'Add to favorites'}
                    title={userFavorites.has(checkIn.place_id!) ? 'Remove from favorites' : 'Add to favorites'}
                    disabled={favoritesLoading}
                  >
                    {userFavorites.has(checkIn.place_id!) ? '⭐' : '☆'}
                  </button>
                )}
                {/* Delete button - only show for current user's posts */}
                {currentUser && checkIn.user_id === currentUser.id && (
                  <button
                    onClick={() => openDeleteModal(checkIn)}
                    className="feed-card-delete-btn"
                    aria-label="Delete check-in"
                    title="Delete this check-in"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="feed-load-more">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-secondary feed-load-more-btn"
          >
            {loadingMore ? (
              <>
                <span className="feed-loading-spinner"></span>
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
        </>
      )}
      
      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageUrl={imageModal.imageUrl}
        imageAlt={imageModal.imageAlt}
      />

             {/* Delete Confirmation Modal */}
       {deleteModal.isOpen && deleteModal.checkIn && (
         <div className="modal-overlay">
           <div className="modal-content">
             <div className="modal-header">
               <h3 className="modal-title">Delete Check-in?</h3>
             </div>
             <div className="modal-body">
               <p>Are you sure you want to delete your check-in about:</p>
               <div className="delete-modal-details">
                 <strong>{getTileTitle(deleteModal.checkIn)}</strong>
                 <span className="delete-modal-date">
                   {formatDateTime(deleteModal.checkIn.created_at)}
                 </span>
               </div>
               <p className="delete-modal-warning">
                 This action cannot be undone. The check-in and any associated photo will be permanently removed.
               </p>
             </div>
             <div className="modal-actions">
               <button onClick={closeDeleteModal} className="btn btn-secondary">
                 Cancel
               </button>
               <button onClick={deleteCheckIn} className="btn btn-danger">
                 Delete
               </button>
             </div>
           </div>
         </div>
       )}

             {/* Toast Notifications */}
       <Toast
         message={toast.message}
         type={toast.type}
         isVisible={toast.isVisible}
         onClose={closeToast}
       />
       

    </div>
  )
}
