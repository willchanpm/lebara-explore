'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Define the structure of a place object
// This helps TypeScript understand what data we're working with
interface Place {
  id: number
  name: string
  category: string
  price_band: string
  url: string
  notes?: string // Optional field for additional information
  lat?: number // Optional latitude coordinate
  lon?: number // Optional longitude coordinate
}

export default function PlacesPage() {
  // State variables to manage the component's data and UI state
  const [places, setPlaces] = useState<Place[]>([]) // Stores the list of places
  const [loading, setLoading] = useState(true) // Shows loading spinner while fetching data
  const [error, setError] = useState<string | null>(null) // Stores any error messages
  const [activeFilter, setActiveFilter] = useState<string>('All') // Tracks the currently selected filter
  const [searchQuery, setSearchQuery] = useState<string>('') // Stores the search input text
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('') // Debounced search query for performance

  // Helper function to render the places content
  const renderPlacesContent = () => {
    // First filter by category
    const categoryFiltered = activeFilter === 'All' 
      ? places 
      : places.filter(place => place.category === activeFilter)
    
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-card border-2 border-black/8 dark:border-white/8">
              <span className="text-3xl">🏪</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text">No places yet</h3>
            <p className="text-base text-muted">Ask the team to add some</p>
          </div>
        )
      } else if (categoryFiltered.length === 0) {
        // No places match the current category filter
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-card border-2 border-black/8 dark:border-white/8">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text">No places found</h3>
            <p className="text-base text-muted">Try selecting a different category</p>
          </div>
        )
      } else {
        // No places match the search query
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-card border-2 border-black/8 dark:border-white/8">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-text">No search results</h3>
            <p className="text-base text-muted">Try different search terms or categories</p>
          </div>
        )
      }
    }
    
    // Show filtered places
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              className="
                w-full text-left rounded-2xl border p-5 mb-4 focus:outline-none focus:ring-2
                transition-all duration-200 hover:scale-[1.01]
                bg-card border-black/8 dark:border-white/8
              "
              onClick={() => {
                // Handle card click - could open details modal or navigate
                console.log('Clicked place:', place.name)
              }}
            >
              {/* Header: name, price, and category pill */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight mb-1 text-text">
                    {place.name}
                  </h3>
                  <span className="text-sm text-muted">
                    {place.price_band}
                  </span>
                </div>
                <span className="
                  ml-3 inline-flex items-center px-2 py-1 text-xs rounded-full
                  flex-shrink-0 font-medium
                  bg-card text-muted border border-black/8 dark:border-white/8
                ">
                  {place.category.replace('_', ' ')}
                </span>
              </div>
              
              {/* Body: notes/description */}
              {place.notes && (
                <p className="text-sm leading-relaxed mb-4 text-muted">
                  {place.notes}
                </p>
              )}
              
              {/* Footer: action buttons */}
              <div className="flex items-center gap-2">
                {/* Maps button - only show if coordinates exist */}
                {place.lat && place.lon && (
                  <a 
                    href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="
                      flex-1 inline-flex items-center justify-center text-sm font-medium px-3 py-2 rounded-lg
                      transition-all duration-200 hover:scale-105
                      bg-card border border-brand text-brand hover:bg-brand/8
                    "
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
                  className="
                    flex-1 inline-flex items-center justify-center text-sm font-medium px-3 py-2 rounded-lg
                    transition-all duration-200 hover:scale-105
                    bg-brand hover:bg-brand-700 text-white
                  "
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
          <div className="mt-6 text-center text-sm text-muted">
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
      <div className="min-h-screen pb-24 bg-bg">
        <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 py-6">
            <h1 className="text-3xl font-bold mb-2 text-text">Places</h1>
            <p className="text-sm font-medium text-muted">Pulled from Supabase</p>
          </div>
          
          {/* Skeleton loading cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl p-5 bg-card border border-black/8 dark:border-white/8">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-16 ml-3"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
      <div className="min-h-screen pb-24 bg-bg">
        <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 py-6">
            <h1 className="text-3xl font-bold mb-2 text-text">Places</h1>
            <p className="text-sm font-medium text-muted">Pulled from Supabase</p>
          </div>
          
          {/* Error alert */}
          <div className="rounded-xl border p-3 text-sm bg-card border-black/8 dark:border-white/8 text-text">
            <h2 className="font-semibold mb-1">Error Loading Places</h2>
            <p className="mb-3">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen pb-24 bg-bg">
      <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 py-6">
          <h1 className="text-3xl font-bold mb-2 text-text">Places</h1>
          <p className="text-sm font-medium text-muted">Pulled from Supabase</p>
        </div>

        {/* Search input */}
        <div className="mb-4 px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search places by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-12 py-3 rounded-xl text-sm
                border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-0
                placeholder:text-sm
                bg-card text-text border-black/8 dark:border-white/8
              "
            />
            {/* Search icon */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg text-muted">
              🔍
            </div>
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="
                  absolute right-3 top-1/2 transform -translate-y-1/2
                  w-6 h-6 rounded-full flex items-center justify-center
                  transition-all duration-200 hover:scale-110
                  bg-muted text-card
                "
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="mb-6 px-4">
          <div className="flex flex-wrap gap-2">
            {['All', 'market', 'street_food', 'veg', 'vegan', 'coffee', 'Fine_Dining', '24-7', 'activity', 'landmark'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  hover:scale-105 active:scale-95
                  ${activeFilter === category 
                    ? 'bg-brand text-white' 
                    : 'bg-card text-muted border border-black/8 dark:border-white/8'
                  }
                `}
              >
                {category === 'All' ? 'All Places' : category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Filter and display places */}
        <div className="px-4">
          {renderPlacesContent()}
        </div>
      </div>
    </div>
  )
}
