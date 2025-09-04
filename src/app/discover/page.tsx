'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import AddPlaceModal from '@/components/AddPlaceModal'
import { toggleFavorite, getFavoriteStatusForPlaces } from '@/lib/favorites'
import type { User } from '@supabase/supabase-js'

// Define the structure of a place object
// This helps TypeScript understand what data we're working with
interface Place {
  id: number
  name: string
  category: string
  price_band: string
  url: string
  maps_url?: string // Optional field for Google Maps URL
  notes?: string // Optional field for additional information
  lat?: number // Optional latitude coordinate
  lon?: number // Optional longitude coordinate
  veg_friendly?: boolean // Optional field for vegetarian-friendly places
  user_submitted?: boolean // Optional field to indicate if place was submitted by a user
  submitted_by?: string // Optional field to store the user ID who submitted the place
}

export default function DiscoverPage() {
  // State variables to manage the component's data and UI state
  const [places, setPlaces] = useState<Place[]>([]) // Stores the list of places
  const [loading, setLoading] = useState(true) // Shows loading spinner while fetching data
  const [error, setError] = useState<string | null>(null) // Stores any error messages
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['All'])) // Tracks multiple selected filters
  const [searchQuery, setSearchQuery] = useState<string>('') // Stores the search input text
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('') // Debounced search query for performance
  
  // State for the add place modal
  const [showAddPlace, setShowAddPlace] = useState(false)
  
  // State for favorites functionality
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  // State for available categories - will be populated dynamically from places data
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  // Function to fetch places data
  const fetchPlaces = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Query Supabase for all places, ordered by name
      const { data, error: supabaseError } = await supabase
        .from('places')
        .select('*')
        .order('name')

      // Check if there was an error with the Supabase query
      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Update the places state with the fetched data
      setPlaces(data || [])
      
      // Extract unique categories from the places data and sort them
      if (data && data.length > 0) {
        const categories = [...new Set(data.map(place => place.category))].sort()
        setAvailableCategories(categories)
      }
    } catch (err) {
      // If anything goes wrong, store the error message
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      // Always stop loading, whether we succeeded or failed
      setLoading(false)
    }
  }

  // Function to fetch user favorites
  const fetchUserFavorites = useCallback(async () => {
    if (!currentUser) return
    
    try {
      setFavoritesLoading(true)
      
      // Get all place IDs from places to check favorite status
      const placeIds = places.map(place => place.id)
      
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
        // Convert numeric IDs to strings for consistency with the Set
        const stringFavoritedIds = new Set(Array.from(favoritedIds).map(id => id.toString()))
        setUserFavorites(stringFavoritedIds)
      }
    } catch (err) {
      console.error('Error fetching user favorites:', err)
    } finally {
      setFavoritesLoading(false)
    }
  }, [currentUser, places])

  // Function to handle favorite toggle
  const handleFavoriteToggle = async (placeId: number) => {
    if (!currentUser) return
    
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
          const placeIdStr = placeId.toString()
          if (newFavorites.has(placeIdStr)) {
            newFavorites.delete(placeIdStr)
          } else {
            newFavorites.add(placeIdStr)
          }
          return newFavorites
        })
      } else {
        console.error('Failed to toggle favorite:', error)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  // Helper function to render the places content
  const renderPlacesContent = () => {
    // First filter by category
    let categoryFiltered: Place[]
    
    if (activeFilters.has('All')) {
      categoryFiltered = places
    } else {
      categoryFiltered = []
      
      // Apply each selected filter
      activeFilters.forEach(filter => {
        if (filter === 'Favourites') {
          // Filter for user's favorite places
          if (currentUser) {
            const favoritePlaces = places.filter(place => userFavorites.has(place.id.toString()))
            categoryFiltered = [...categoryFiltered, ...favoritePlaces]
          }
        } else {
          // Filter by regular category
          const categoryPlaces = places.filter(place => place.category === filter)
          categoryFiltered = [...categoryFiltered, ...categoryPlaces]
        }
      })
      
      // Remove duplicates (in case a place matches multiple filters)
      categoryFiltered = categoryFiltered.filter((place, index, self) => 
        index === self.findIndex(p => p.id === place.id)
      )
    }
    
    // Then filter by search query (case-insensitive)
    const filteredPlaces = debouncedSearchQuery.trim() === '' 
      ? categoryFiltered
      : categoryFiltered.filter(place => {
          const searchLower = debouncedSearchQuery.toLowerCase()
          const nameMatch = place.name.toLowerCase().includes(searchLower)
          const notesMatch = place.notes?.toLowerCase().includes(searchLower) || false
          return nameMatch || notesMatch
        })
    
    // Compute if there are active filters
    const hasActiveFilters = debouncedSearchQuery.trim() !== '' || 
      (activeFilters.size > 0 && !activeFilters.has('All')) ||
      activeFilters.has('Favourites')
    
    // Clear all filters function
    const clearAllFilters = () => {
      setActiveFilters(new Set(['All']))
      setSearchQuery('')
    }
    
    if (filteredPlaces.length === 0) {
      // Show Bootstrap empty state
      return (
        <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 my-4 pb-5">
          <div className="bg-white rounded-4 shadow-sm d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
          </div>
          <h4 className="fw-bold mb-1">No places found</h4>
          <p className="text-muted mb-4">
            {hasActiveFilters ? "Try adjusting or clearing your filters." : "You haven't added any favourites yet."}
          </p>
          <div className="d-flex gap-2">
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={clearAllFilters}>
                Clear filters
              </button>
            )}
            <a href="/add-place" className="btn text-white rounded-pill px-3" style={{ backgroundColor: "rgba(255, 49, 130, 0.85)" }}>
              Add Place
            </a>
          </div>
        </div>
      )
    }
    
    // Show filtered places
    return (
      <>
        <div className="places-grid pb-5">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="card bg-white shadow-sm rounded-xl mb-3"
              onClick={() => {
                // Handle card click - could open details modal or navigate
                console.log('Clicked place:', place.name)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  console.log('Clicked place:', place.name)
                }
              }}
            >
              <div className="card-body">
                {/* Title + favourite star row */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  {/* Left: Title with price band */}
                  <h5 className="card-title fw-bold mb-0">
                    {place.name} {place.price_band && <small className="text-muted">({place.price_band})</small>}
                  </h5>
                  {/* Right: Favorite button - show for all users */}
                  {currentUser && (
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      aria-label={userFavorites.has(place.id.toString()) ? 'Remove from favourites' : 'Add to favourites'}
                      aria-pressed={userFavorites.has(place.id.toString())}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click when clicking favorite button
                        handleFavoriteToggle(place.id)
                      }}
                      title={userFavorites.has(place.id.toString()) ? 'Remove from favorites' : 'Add to favorites'}
                      disabled={favoritesLoading}
                      data-testid={`fav-${place.id}`}
                    >
                      <i className={`bi ${userFavorites.has(place.id.toString()) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`} style={{ fontSize: '1.5rem' }} />
                    </button>
                  )}
                </div>
                
                {/* Category chip */}
                <div className="mb-2 mt-1">
                  <span className="badge rounded-pill bg-light text-dark small">
                    {place.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                  {/* User submitted badge */}
                  {place.user_submitted && (
                    <span className="badge rounded-pill text-bg-info me-2">
                      👥 User Submitted
                    </span>
                  )}
                </div>
                
                {/* Subtitle/description */}
                {place.notes && (
                  <p className="card-text text-muted mb-3">{place.notes}</p>
                )}
                
                {/* Actions row (equal width) */}
                <div className="row g-2">
                  {/* Maps button - only show if maps_url exists */}
                  {place.maps_url && (
                    <div className="col-6">
                      <a 
                        href={place.maps_url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="maps-btn btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                        data-testid={`maps-${place.id}`}
                      >
                        🗺️ Maps
                      </a>
                    </div>
                  )}
                  {/* Website link */}
                  <div className={place.maps_url ? "col-6" : "col-12"}>
                    <a 
                      href={place.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn w-100 text-white d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: 'rgba(255, 49, 130, 0.85)' }}
                      onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                      data-testid={`website-${place.id}`}
                    >
                      🌍 Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary of results */}
        {places.length > 0 && (
          <div className="results-summary">
            <p>
              {(() => {
                const totalPlaces = places.length
                const categoryCount = categoryFiltered.length
                const finalCount = filteredPlaces.length
                
                if (debouncedSearchQuery.trim() === '' && activeFilters.has('All') && activeFilters.size === 1) {
                  return `Found ${totalPlaces} place${totalPlaces === 1 ? '' : 's'}`
                } else if (debouncedSearchQuery.trim() === '') {
                  const filterNames = Array.from(activeFilters).map(filter => 
                    filter === 'Favourites' ? 'Favourites' :
                    filter.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  ).join(', ')
                  return `Found ${categoryCount} place${categoryCount === 1 ? '' : 's'} in: ${filterNames}`
                } else if (activeFilters.has('All') && activeFilters.size === 1) {
                  return `Found ${finalCount} place${finalCount === 1 ? '' : 's'} matching "${debouncedSearchQuery}"`
                } else {
                  return `Found ${finalCount} place${finalCount === 1 ? '' : 's'} matching "${debouncedSearchQuery}"`
                }
              })()}
            </p>
          </div>
        )}
      </>
    )
  }

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

  // Fetch user favorites when user changes or places change
  useEffect(() => {
    if (currentUser && places.length > 0) {
      fetchUserFavorites()
    }
  }, [currentUser, places, fetchUserFavorites])

  // useEffect runs when the component first loads (on mount)
  // This is where we fetch data from Supabase
  useEffect(() => {
    // Call the fetch function
    fetchPlaces()
  }, []) // Empty dependency array means this only runs once when component mounts

  // Debounce search input to avoid jitter on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="container py-4">
        {/* Header */}
        <div className="discover-header">
          <h1 className="display-5 fw-bold text-center mb-2">Discover</h1>
          <p className="lead text-center text-muted mb-4">Browse places around Liverpool Street</p>
        </div>
          
          {/* Skeleton loading cards */}
          <div className="skeleton-container">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-header">
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text medium"></div>
                </div>
                <div className="skeleton-text full"></div>
                <div className="skeleton-actions">
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
      </div>
    )
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="container py-4">
        {/* Header */}
        <div className="discover-header">
          <h1 className="display-5 fw-bold text-center mb-2">Discover</h1>
          <p className="lead text-center text-muted mb-4">Browse places around Liverpool Street</p>
        </div>
          
          {/* Error alert */}
          <div className="error-alert">
            <h2 className="error-title">Error Loading Places</h2>
            <p className="error-message">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
      </div>
    )
  }

  // Show the main content with the places list
  return (
    <>
      <div className="container py-4">
      {/* Header */}
      <div className="discover-header">
        <h1 className="display-5 fw-bold text-center mb-2">Discover</h1>
        <p className="lead text-center text-muted mb-4">Browse places around Liverpool Street</p>
      </div>

        {/* Search input */}
        <div className="input-group mb-3">
          <span className="input-group-text" aria-hidden="true">🔎</span>
          <input 
            className="form-control" 
            type="search" 
            placeholder="Search places by name or notes..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* Add Place helper */}
        <div className="d-flex align-items-center justify-content-center rounded-4 border border-light-subtle bg-white px-3 py-2 mb-3">
          <span className="text-muted small mb-0 me-2">Can&apos;t find your favourite?</span>
          <button type="button" className="btn btn-link p-0 fw-semibold small text-decoration-none text-nowrap" style={{ color: "rgba(255, 49, 130, 0.85)" }} onClick={() => setShowAddPlace(true)} data-testid="add-place-link">
            Add Place
          </button>
        </div>

        {/* Filter buttons */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {/* Always show 'All' and 'Favourites' filters */}
          {['All', 'Favourites'].map((category) => {
            const isActive = activeFilters.has(category)
            const label = category === 'All' ? 'All Places' : '⭐ Favourites'
            
            return (
              <button
                key={category}
                type="button"
                className={`btn btn-sm rounded-pill shadow-sm border ${isActive ? 'text-white border-0' : 'text-dark'}`}
                style={isActive ? { backgroundColor: 'rgba(255, 49, 130, 0.85)' } : { backgroundColor: 'white' }}
                onClick={() => {
                  const newFilters = new Set(activeFilters)
                  if (category === 'All') {
                    // If clicking 'All', clear other filters and select only 'All'
                    newFilters.clear()
                    newFilters.add('All')
                  } else if (activeFilters.has('All') && activeFilters.size === 1) {
                    // If only 'All' is selected and clicking another filter, remove 'All' and add the new filter
                    newFilters.delete('All')
                    newFilters.add(category)
                  } else if (newFilters.has(category)) {
                    // If filter is already selected, remove it
                    newFilters.delete(category)
                    // If no filters left, default back to 'All'
                    if (newFilters.size === 0) {
                      newFilters.add('All')
                    }
                  } else {
                    // Add the new filter
                    newFilters.add(category)
                  }
                  setActiveFilters(newFilters)
                }}
                data-testid={`filter-${category}`}
                aria-pressed={isActive}
              >
                {label}
              </button>
            )
          })}
          
          {/* Dynamically show categories from the places data */}
          {availableCategories.map((category) => {
            const isActive = activeFilters.has(category)
            const label = category === 'other' ? 'Other' :
              category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            
            return (
              <button
                key={category}
                type="button"
                className={`btn btn-sm rounded-pill shadow-sm border ${isActive ? 'text-white border-0' : 'text-dark'}`}
                style={isActive ? { backgroundColor: 'rgba(255, 49, 130, 0.85)' } : { backgroundColor: 'white' }}
                onClick={() => {
                  const newFilters = new Set(activeFilters)
                  if (activeFilters.has('All') && activeFilters.size === 1) {
                    // If only 'All' is selected and clicking another filter, remove 'All' and add the new filter
                    newFilters.delete('All')
                    newFilters.add(category)
                  } else if (newFilters.has(category)) {
                    // If filter is already selected, remove it
                    newFilters.delete(category)
                    // If no filters left, default back to 'All'
                    if (newFilters.size === 0) {
                      newFilters.add('All')
                    }
                  } else {
                    // Add the new filter
                    newFilters.add(category)
                  }
                  setActiveFilters(newFilters)
                }}
                data-testid={`filter-${category}`}
                aria-pressed={isActive}
              >
                {label}
              </button>
            )
          })}
          
          {/* Clear All Filters button - only show when multiple filters are active */}
          {activeFilters.size > 1 || (activeFilters.size === 1 && !activeFilters.has('All')) ? (
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger rounded-pill px-3"
              onClick={() => {
                setActiveFilters(new Set(['All']))
              }}
              aria-label="Clear all filters"
              title="Clear all filters and show all places"
            >
              Clear All
            </button>
          ) : null}
        </div>

        {/* Filter and display places */}
        {renderPlacesContent()}
      </div>
      
      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={showAddPlace}
        onClose={() => setShowAddPlace(false)}
        onPlaceAdded={() => {
          // Refresh the places list when a new place is added
          fetchPlaces()
        }}
      />
      
      {/* Floating Action Button */}
      <div className="position-fixed end-0"
           style={{
             zIndex: 1100,
             right: "1rem",
             bottom: "calc(var(--bottom-nav-h, 64px) + 1rem + env(safe-area-inset-bottom, 0px))"
           }}>
        <button type="button"
                onClick={() => setShowAddPlace(true)}
                className="btn rounded-circle d-flex align-items-center justify-content-center shadow-lg"
                style={{ width: 56, height: 56, backgroundColor: "rgb(26, 58, 90)", border: "none" }}
                aria-label="Add Place"
                data-testid="fab-add-place">
          <i className="bi bi-plus-lg text-white" style={{ fontSize: "1.5rem" }}></i>
        </button>
      </div>
    </>
  )
}

