'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AddPlaceModal from '@/components/AddPlaceModal'

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
  const [activeFilter, setActiveFilter] = useState<string>('All') // Tracks the currently selected filter
  const [searchQuery, setSearchQuery] = useState<string>('') // Stores the search input text
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('') // Debounced search query for performance
  
  // State for the add place modal
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false)

  // Helper function to render the places content
  const renderPlacesContent = () => {
    // First filter by category
    let categoryFiltered: Place[]
    
    if (activeFilter === 'All') {
      categoryFiltered = places
    } else if (activeFilter === 'User Submitted') {
      // Filter for user-submitted places
      categoryFiltered = places.filter(place => place.user_submitted === true)
    } else {
      // Filter by regular category
      categoryFiltered = places.filter(place => place.category === activeFilter)
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
        return (
                  <div className="no-places-container">
          <div className="no-places-icon">
            <span className="no-places-emoji">🔍</span>
          </div>
          <h3 className="no-places-title">No places found</h3>
          <p className="no-places-subtitle">Try selecting a different category</p>
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
            <button
              key={place.id}
              className="place-card"
              onClick={() => {
                // Handle card click - could open details modal or navigate
                console.log('Clicked place:', place.name)
              }}
            >
              {/* Header: name, price, and category pill */}
              <div className="place-header">
                <div className="place-info">
                  <h3 className="place-name">
                    {place.name} ({place.price_band})
                  </h3>
                  {/* Show user-submitted indicator */}
                  {place.user_submitted && (
                    <div className="user-submitted-badge">
                      👥 User Submitted
                    </div>
                  )}
                </div>
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
            </button>
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
                
                if (debouncedSearchQuery.trim() === '' && activeFilter === 'All') {
                  return `Found ${totalPlaces} place${totalPlaces === 1 ? '' : 's'}`
                } else if (debouncedSearchQuery.trim() === '') {
                  return `Found ${categoryCount} ${activeFilter.replace('_', ' ')} place${categoryCount === 1 ? '' : 's'}`
                } else if (activeFilter === 'All') {
                  return `Found ${finalCount} place${finalCount === 1 ? '' : 's'} matching "${debouncedSearchQuery}"`
                } else {
                  return `Found ${finalCount} ${activeFilter.replace('_', ' ')} place${finalCount === 1 ? '' : 's'} matching "${debouncedSearchQuery}"`
                }
              })()}
            </p>
          </div>
        )}
      </>
    )
  }

  // useEffect runs when the component first loads (on mount)
  // This is where we fetch data from Supabase
  useEffect(() => {
    // Define an async function to fetch places data
    const fetchPlaces = async () => {
      try {
        // Reset any previous errors
        setError(null)
        
        // Query Supabase for all places, ordered by name
        // This is the database query you requested
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
      } catch (err) {
        // If anything goes wrong, store the error message
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        // Always stop loading, whether we succeeded or failed
        setLoading(false)
      }
    }

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
          <span className="add-place-text">Can't find your favourite? </span>
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
            {['All', 'market', 'street_food', 'veg', 'vegan', 'coffee', 'Fine_Dining', '24_7', 'activity', 'landmark', 'other', 'User Submitted'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`filter-chip ${activeFilter === category ? 'active' : 'inactive'}`}
              >
                {category === 'All' ? 'All Places' : 
                 category === 'User Submitted' ? '👥 User Submitted' :
                 category === 'other' ? '🔍 Other' :
                 category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
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
