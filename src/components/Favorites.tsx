'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getUserFavorites, toggleFavorite } from '@/lib/favorites'
import type { User } from '@supabase/supabase-js'
import type { PlaceWithFavorite } from '@/lib/favorites'
import { useToast } from './ToastsProvider'

// Interface for the component props
interface FavoritesProps {
  currentUser: User | null
}

export default function Favorites({ currentUser }: FavoritesProps) {
  // State for favorites data
  const [favorites, setFavorites] = useState<PlaceWithFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null)
  
  // Toast hook
  const toast = useToast()

  // Function to fetch user favorites
  const fetchFavorites = useCallback(async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await getUserFavorites(supabase, currentUser.id)
      
      if (error) {
        setError(error)
        return
      }
      
      setFavorites(data || [])
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Fetch user favorites when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      fetchFavorites()
    }
  }, [currentUser, fetchFavorites])

  // Function to remove a favorite
  const handleRemoveFavorite = async (placeId: string) => {
    if (!currentUser) return
    
    try {
      setRemovingFavorite(placeId)
      
      const { success, error } = await toggleFavorite(
        supabase,
        currentUser.id,
        placeId
      )
      
      if (success) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.id !== placeId))
        toast.success('Removed from favorites')
      } else {
        toast.error(error || 'Failed to remove favorite')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      toast.error('Failed to remove favorite')
    } finally {
      setRemovingFavorite(null)
    }
  }


  // Function to get activity icon based on category
  const getActivityIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'restaurant':
        return '🍽️'
      case 'cafe':
        return '☕'
      case 'bar':
        return '🍺'
      case 'fast food':
        return '🍔'
      case 'dessert':
        return '🍰'
      case 'coffee':
        return '☕'
      case 'pizza':
        return '🍕'
      case 'asian':
        return '🥢'
      case 'italian':
        return '🍝'
      case 'mexican':
        return '🌮'
      case 'indian':
        return '🍛'
      case 'mediterranean':
        return '🥙'
      default:
        return '🍽️'
    }
  }

  // If no user, show sign-in message
  if (!currentUser) {
    return (
      <div className="favorites-signin">
        <div className="favorites-signin-content">
          <div className="favorites-signin-icon">🔐</div>
          <h3 className="favorites-signin-title">Sign in to view favorites</h3>
          <p className="favorites-signin-text">
            Join the community to save your favorite places!
          </p>
          <a href="/login" className="btn btn-primary">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="favorites-loading-spinner"></div>
        <p>Loading your favorites...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="favorites-error">
        <div className="favorites-error-content">
          <div className="favorites-error-icon">⚠️</div>
          <h3 className="favorites-error-title">Something went wrong</h3>
          <p className="favorites-error-text">{error}</p>
          <button onClick={fetchFavorites} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <div className="favorites-empty-content">
          <div className="favorites-empty-icon">⭐</div>
          <h3 className="favorites-empty-title">No favorites yet</h3>
          <p className="favorites-empty-text">
            Start exploring places and add them to your favorites!
          </p>
          <div className="favorites-empty-actions">
            <a href="/bingo" className="btn btn-primary">
              Explore Bingo
            </a>
            <a href="/discover" className="btn btn-secondary">
              Discover Places
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-component">
      {/* Header */}
      <div className="favorites-header">
        <h2 className="favorites-title">Your Favorites</h2>
        <p className="favorites-subtitle">
          {favorites.length} place{favorites.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Favorites grid */}
      <div className="favorites-grid">
        {favorites.map((favorite) => (
          <div key={favorite.id} className="favorite-card">
            {/* Card header with icon and remove button */}
            <div className="favorite-card-header">
              <div className="favorite-card-icon">
                {getActivityIcon(favorite.category)}
              </div>
              <button
                onClick={() => handleRemoveFavorite(favorite.id)}
                className="favorite-card-remove-btn"
                aria-label="Remove from favorites"
                title="Remove from favorites"
                disabled={removingFavorite === favorite.id}
              >
                {removingFavorite === favorite.id ? '⏳' : '🗑️'}
              </button>
            </div>

            {/* Card content */}
            <div className="favorite-card-content">
              <h3 className="favorite-card-title">{favorite.name}</h3>
              <p className="favorite-card-category">{favorite.category}</p>
              
              {/* Action buttons */}
              <div className="favorite-card-actions">
                {favorite.maps_url && (
                  <a
                    href={favorite.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="favorite-card-maps-btn"
                  >
                    📍 View on Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
