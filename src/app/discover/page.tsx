'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
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
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false)
  
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
      const { data, error: supabaseError } = await createSupabaseBrowser()
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
        createSupabaseBrowser(),
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
        createSupabaseBrowser(),
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
    
    if (filteredPlaces.length === 0) {
      if (places.length === 0) {
        // No places at all
        return (
                  <div className="no-places-container">
          <div className="no-places-icon">
            <span className="no-places-emoji">🏪</span>
          </div>
          <h3 className="no-places-title">No places yet</h3>
          <p className="no-places-subtitle">Ask the team to add some</p>
        </div>
        )
      } else if (categoryFiltered.length === 0) {
        // No places match the current category filter
        let message = 'Try selecting a different category'
        let icon = '🔍'
        
        if (activeFilters.has('Favourites')) {
          if (!currentUser) {
            message = 'Please sign in to view your favorites'
            icon = '🔐'
          } else {
            message = 'You haven&apos;t favorited any places yet'
            icon = '⭐'
          }
        }
        
        return (
          <div className="no-places-container">
            <div className="no-places-icon">
              <span className="no-places-emoji">{icon}</span>
            </div>
            <h3 className="no-places-title">No places found</h3>
            <p className="no-places-subtitle">{message}</p>
          </div>
        )
      } else {
        // No places match the search query
        return (
                  <div className="no-places-container">
          <div className="no-places-icon">
            <span className="no-places-emoji">🔍</span>
          </div>
          <h3 className="no-places-title">No search results</h3>
          <p className="no-places-subtitle">Try different search terms or categories</p>
        </div>
        )
      }
    }
    
    // Show filtered places
    return (
      <>
        <div className="places-grid">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="place-card clickable"
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
              {/* Header: name, price, and favorite button */}
              <div className="place-header">
                <h3 className="place-name">
                  {place.name} ({place.price_band})
                </h3>
                {/* Favorite button - show for all users */}
                {currentUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click when clicking favorite button
                      handleFavoriteToggle(place.id)
                    }}
                    className={`place-favorite-btn ${userFavorites.has(place.id.toString()) ? 'favorited' : ''}`}
                    aria-label={userFavorites.has(place.id.toString()) ? 'Remove from favorites' : 'Add to favorites'}
                    title={userFavorites.has(place.id.toString()) ? 'Remove from favorites' : 'Add to favorites'}
                    disabled={favoritesLoading}
                  >
                    {userFavorites.has(place.id.toString()) ? '⭐' : '☆'}
                  </button>
                )}
              </div>
              
              {/* User submitted badge - now below the header */}
              {place.user_submitted && (
                <div className="user-submitted-badge">
                  👥 User Submitted
                </div>
              )}
              
              {/* Category label - now under the title */}
              <div className="place-category-section">
                <span className="place-category">
                  {place.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
              
              {/* Body: notes/description */}
              {place.notes && (
                <p className="place-notes">
                  {place.notes}
                </p>
              )}
              
              {/* Footer: action buttons */}
              <div className="place-actions">
                {/* Maps button - only show if maps_url exists */}
                {place.maps_url && (
                  <a 
                    href={place.maps_url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                  >
                    🗺️ Maps
                  </a>
                )}
                {/* Website link */}
                <a 
                  href={place.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
                >
                  🌐 Website
                </a>
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
        const { data: { user }, error } = await createSupabaseBrowser().auth.getUser()
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
      <div className="discover-page">
        <div className="discover-container">
          {/* Header */}
          <div className="discover-header">
            <h1 className="discover-title">Discover</h1>
            <p className="discover-subtitle">Browse places around Liverpool Street</p>
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
      </div>
    )
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="discover-page">
        <div className="discover-container">
          {/* Header */}
          <div className="discover-header">
            <h1 className="discover-title">Discover</h1>
            <p className="discover-subtitle">Browse places around Liverpool Street</p>
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
      </div>
    )
  }

  // Show the main content with the places list
  return (
    <div className="discover-page">
      <div className="discover-container">
        {/* Header */}
        <div className="discover-header">
          <h1 className="discover-title">Discover</h1>
          <p className="discover-subtitle">Browse places around Liverpool Street</p>
        </div>

        {/* Search input */}
        <div className="search-container">
          <div className="relative">
            <input
              type="text"
              placeholder="Search places by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {/* Search icon */}
            <div className="search-icon">
              🔍
            </div>
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-primary"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Add Place Section */}
        <div className="add-place-section">
          <span className="add-place-text">Can&apos;t find your favourite? </span>
          <button
            onClick={() => setIsAddPlaceModalOpen(true)}
            className="add-place-link-button"
            aria-label="Add a new place"
          >
            Add Place
          </button>
        </div>

        {/* Filter chips */}
        <div className="filter-container">
          <div className="filter-chips">
            {/* Always show 'All' and 'Favourites' filters */}
            {['All', 'Favourites'].map((category) => (
              <button
                key={category}
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
                className={`filter-chip ${activeFilters.has(category) ? 'active' : 'inactive'}`}
                data-filter={category}
                data-active={activeFilters.has(category)}
              >
                {category === 'All' ? 'All Places' : '⭐ Favourites'}
              </button>
            ))}
            
            {/* Dynamically show categories from the places data */}
            {availableCategories.map((category) => (
              <button
                key={category}
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
                className={`filter-chip ${activeFilters.has(category) ? 'active' : 'inactive'}`}
                data-filter={category}
                data-active={activeFilters.has(category)}
              >
                {category === 'other' ? 'Other' :
                 category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
          
          {/* Clear All Filters button - only show when multiple filters are active */}
          {activeFilters.size > 1 || (activeFilters.size === 1 && !activeFilters.has('All')) ? (
            <div className="clear-filters-container">
              <button
                onClick={() => {
                  setActiveFilters(new Set(['All']))
                }}
                className="clear-filters-btn"
                aria-label="Clear all filters"
                title="Clear all filters and show all places"
              >
                🗑️ Clear All
              </button>
            </div>
          ) : null}
        </div>

        {/* Filter and display places */}
        {renderPlacesContent()}
      </div>
      
      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={isAddPlaceModalOpen}
        onClose={() => setIsAddPlaceModalOpen(false)}
        onPlaceAdded={() => {
          // Refresh the places list when a new place is added
          fetchPlaces()
        }}
        userEmail={currentUser?.email || null}
      />
      
      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddPlaceModalOpen(true)}
        className="fab-add-place"
        aria-label="Add a new place"
      >
        <span className="fab-icon">+</span>
      </button>
    </div>
  )
}

