'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Interface for check-in data from the database
interface CheckIn {
  id: string
  user_id: string
  tile_id: string
  board_month: string
  comment: string
  rating: number
  photo_url: string | null
  created_at: string
}

// Local mapping of tile IDs to human-readable labels
// TODO: Replace this with a proper database join later
const TILE_LABELS: Record<string, string> = {
  'try-new-cuisine': 'Try New Cuisine',
  'cook-at-home': 'Cook at Home',
  'visit-farmers-market': 'Visit Farmers Market',
  'eat-seasonal': 'Eat Seasonal',
  'try-street-food': 'Try Street Food',
  'dine-outdoors': 'Dine Outdoors',
  'make-dessert': 'Make Dessert',
  'learn-recipe': 'Learn New Recipe',
  'host-dinner': 'Host Dinner',
  'food-adventure': 'Food Adventure',
  'breakfast-in-bed': 'Breakfast in Bed',
  'midnight-snack': 'Midnight Snack',
  'picnic-lunch': 'Picnic Lunch',
  'dinner-date': 'Dinner Date',
  'brunch-weekend': 'Weekend Brunch',
  'coffee-shop': 'Coffee Shop Visit',
  'bakery-treat': 'Bakery Treat',
  'ice-cream': 'Ice Cream',
  'smoothie-bowl': 'Smoothie Bowl',
  'pizza-night': 'Pizza Night',
  'taco-tuesday': 'Taco Tuesday',
  'sushi-roll': 'Sushi Roll',
  'burger-joint': 'Burger Joint',
  'salad-bowl': 'Fresh Salad',
  'soup-season': 'Soup Season'
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

// Helper function to render star rating
function renderStars(rating: number): JSX.Element[] {
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
  }, [])

  // Function to fetch check-ins from Supabase
  const fetchCheckIns = async (isLoadMore = false) => {
    try {
      setError(null)
      
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      // Build the query
      let query = supabase
        .from('check_ins')
        .select('id, user_id, tile_id, board_month, comment, rating, photo_url, created_at')
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
        if (isLoadMore) {
          setCheckIns(prev => [...prev, ...data])
        } else {
          setCheckIns(data)
        }
        
        // Check if we have more results
        setHasMore(data.length === 20)
        
        // Extract unique months for filter dropdown
        const months = [...new Set(data.map(checkIn => checkIn.board_month))]
        setAvailableMonths(months)
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err)
      setError('Failed to load check-ins. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Function to load more check-ins
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCheckIns(true)
    }
  }

  // Function to apply filters
  const applyFilters = () => {
    setCheckIns([]) // Clear current list
    setHasMore(true) // Reset pagination
    fetchCheckIns() // Fetch with new filters
  }

  // Apply filters when filter states change
  useEffect(() => {
    if (checkIns.length > 0) { // Only apply if we have data
      applyFilters()
    }
  }, [selectedMonth, showMyPosts])

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

  // Empty state
  if (checkIns.length === 0) {
    return (
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
    )
  }

  return (
    <div className="feed-component">
      {/* Filters */}
      <div className="feed-filters">
        <div className="feed-filter-group">
          <label htmlFor="month-filter" className="feed-filter-label">
            Month:
          </label>
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="feed-filter-select"
          >
            <option value="all">All months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        
        <div className="feed-filter-group">
          <label className="feed-filter-toggle">
            <input
              type="checkbox"
              checked={showMyPosts}
              onChange={(e) => setShowMyPosts(e.target.checked)}
              className="feed-filter-checkbox"
            />
            <span className="feed-filter-toggle-text">My posts only</span>
          </label>
        </div>
      </div>

      {/* Check-ins list */}
      <div className="feed-list">
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="feed-card">
            {/* Card header with tile label and date */}
            <div className="feed-card-header">
              <h3 className="feed-card-title">
                {TILE_LABELS[checkIn.tile_id] || checkIn.tile_id}
              </h3>
              <time className="feed-card-date" dateTime={checkIn.created_at}>
                {formatDateTime(checkIn.created_at)}
              </time>
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
                  alt={`Check-in photo for ${TILE_LABELS[checkIn.tile_id] || checkIn.tile_id}`}
                  className="feed-card-image"
                  loading="lazy"
                />
              ) : (
                <div className="feed-card-photo-placeholder">
                  <span className="feed-card-photo-icon">📷</span>
                </div>
              )}
            </div>

            {/* Board month chip */}
            <div className="feed-card-chip">
              {checkIn.board_month}
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
    </div>
  )
}
