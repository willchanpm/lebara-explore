'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import ImageModal from './ImageModal'
import { useToast } from './ToastsProvider'
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
        className={`fs-4 ${i < rating ? 'text-warning' : 'text-muted'}`}
        aria-label={i < rating ? 'Filled star' : 'Empty star'}
        style={{ filter: i < rating ? 'drop-shadow(0 2px 4px rgba(0,0,0,.1))' : 'none' }}
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

  // Toast hook
  const toast = useToast()

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

  // Refetch check-ins when filters change
  useEffect(() => {
    if (currentUser !== null) { // Only refetch after user state is determined
      fetchCheckIns()
    }
  }, [selectedMonth, showMyPosts, currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

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
        toast.success(
          isFavorited ? 'Removed from favorites' : 'Added to favorites'
        )
      } else {
        toast.error(error || 'Failed to update favorite')
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      toast.error('Failed to update favorite')
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
      toast.success('Check-in deleted successfully!')
    }, 100)
    // No need to refetch since we already updated local state
  }

  // Function to handle deletion error
  const handleDeleteError = (error: string) => {
    closeDeleteModal()
    // Use setTimeout to ensure the modal closes before showing toast
    setTimeout(() => {
      toast.error(`Error deleting check-in: ${error}`)
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



  // If user is not authenticated, show sign-in CTA
  if (!currentUser) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <div className="display-1 mb-3">🔐</div>
          <h3 className="h4 mb-3">Sign in to view the feed</h3>
          <p className="text-muted mb-4">
            Join the community to see check-ins from other food explorers!
          </p>
          <a href="/login" className="btn btn-primary btn-lg rounded-pill">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="placeholder-glow">
                  <span className="placeholder col-7"></span>
                </div>
                <div className="placeholder-glow">
                  <span className="placeholder col-4"></span>
                </div>
              </div>
              <div className="placeholder-glow mb-2">
                <span className="placeholder col-3"></span>
              </div>
              <div className="placeholder-glow mb-3">
                <span className="placeholder col-12"></span>
                <span className="placeholder col-8"></span>
              </div>
              <div className="placeholder-glow">
                <span className="placeholder col-12" style={{height: '200px'}}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <div className="display-1 mb-3">⚠️</div>
          <h3 className="h4 mb-3">Something went wrong</h3>
          <p className="text-muted mb-4">{error}</p>
          <button onClick={() => fetchCheckIns()} className="btn btn-primary btn-lg rounded-pill">
            Try again
          </button>
        </div>
      </div>
    )
  }



  return (
    <div>
      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body d-flex flex-wrap align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="month-select" className="form-label mb-0">Month:</label>
            <select
              id="month-select"
              className="form-select form-select-sm"
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
          
          <div className="d-flex align-items-center justify-content-between my-2">
            <span className="text-muted me-3">My posts only</span>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input switch-lg"
                type="checkbox"
                checked={showMyPosts}
                onChange={(e) => setShowMyPosts(e.target.checked)}
                id="my-posts-toggle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on state */}
      {loading ? (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="placeholder-glow">
                    <span className="placeholder col-7"></span>
                  </div>
                  <div className="placeholder-glow">
                    <span className="placeholder col-4"></span>
                  </div>
                </div>
                <div className="placeholder-glow mb-2">
                  <span className="placeholder col-3"></span>
                </div>
                <div className="placeholder-glow mb-3">
                  <span className="placeholder col-12"></span>
                  <span className="placeholder col-8"></span>
                </div>
                <div className="placeholder-glow">
                  <span className="placeholder col-12" style={{height: '200px'}}></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <div className="display-1 mb-3">⚠️</div>
            <h3 className="h4 mb-3">Something went wrong</h3>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={() => fetchCheckIns()} className="btn btn-primary btn-lg rounded-pill">
              Try again
            </button>
          </div>
        </div>
      ) : checkIns.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <div className="display-1 mb-3">🍽️</div>
            <h3 className="h4 mb-3">No check-ins yet</h3>
            <p className="text-muted mb-4">
              Complete a bingo tile to add your first post to the feed!
            </p>
            <a href="/bingo" className="btn btn-primary btn-lg rounded-pill">
              Start exploring
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Check-ins list */}
          <div>
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body">
              {/* Card header with tile label, date, and favorite button */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="card-title mb-1">
                    {getTileTitle(checkIn)}
                  </h5>
                  <small className="text-muted" title={getAuthorName(checkIn, currentUser)}>
                    by {getAuthorName(checkIn, currentUser)}
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <time className="text-muted small" dateTime={checkIn.created_at}>
                    {formatDateTime(checkIn.created_at)}
                  </time>
                  {/* Favorite button - show for all users if place_id exists */}
                  {checkIn.place_id && currentUser && (
                    <button
                      onClick={() => handleFavoriteToggle(checkIn.place_id!)}
                      className={`btn btn-sm ${userFavorites.has(checkIn.place_id!) ? 'btn-warning' : 'btn-outline-warning'}`}
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
              <div className="d-flex align-items-center gap-1 mb-2" aria-label={`Rating: ${checkIn.rating} out of 5 stars`}>
                {renderStars(checkIn.rating)}
              </div>

              {/* Comment */}
              {checkIn.comment && (
                <p className="card-text" title={checkIn.comment}>
                  {checkIn.comment}
                </p>
              )}

              {/* Photo */}
              <div className="mb-3">
                {checkIn.photo_url ? (
                  <Image
                    src={checkIn.photo_url}
                    alt={`${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`}
                    className="img-fluid rounded-3"
                    loading="lazy"
                    onClick={() => openImageModal(checkIn.photo_url!, `${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`)}
                    role="button"
                    tabIndex={0}
                    width={300}
                    height={200}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openImageModal(checkIn.photo_url!, `${getAuthorName(checkIn, currentUser)}'s check-in for ${getTileTitle(checkIn)}`)
                      }
                    }}
                  />
                ) : (
                  <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{height: '200px'}}>
                    <span className="display-4 text-muted">📷</span>
                  </div>
                )}
              </div>

              {/* Board month chip and action buttons container */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="badge bg-secondary">
                  {checkIn.board_month}
                </span>
                <div className="d-flex gap-2">
                  {/* Favorite button - show for all users if place_id exists */}
                  {checkIn.place_id && currentUser && (
                    <button
                      onClick={() => handleFavoriteToggle(checkIn.place_id!)}
                      className={`btn btn-sm ${userFavorites.has(checkIn.place_id!) ? 'btn-warning' : 'btn-outline-warning'}`}
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
                      className="btn btn-sm btn-outline-danger"
                      aria-label="Delete check-in"
                      title="Delete this check-in"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-outline-primary"
          >
            {loadingMore ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
         <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1050 }} onClick={closeDeleteModal}>
           <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
           <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1055 }} onClick={(e) => e.stopPropagation()}>
             <div className="modal-content rounded-4">
               <div className="modal-header">
                 <h5 className="modal-title">Delete Check-in?</h5>
                 <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
               </div>
               <div className="modal-body">
                 <p>Are you sure you want to delete your check-in about:</p>
                 <div className="mb-3">
                   <strong>{getTileTitle(deleteModal.checkIn)}</strong>
                   <br />
                   <small className="text-muted">
                     {formatDateTime(deleteModal.checkIn.created_at)}
                   </small>
                 </div>
                 <p className="text-muted small">
                   This action cannot be undone. The check-in and any associated photo will be permanently removed.
                 </p>
               </div>
               <div className="modal-footer">
                 <button onClick={closeDeleteModal} className="btn btn-secondary">
                   Cancel
                 </button>
                 <button onClick={deleteCheckIn} className="btn btn-danger">
                   Delete
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       

    </div>
  )
}
