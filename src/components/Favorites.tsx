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
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body text-center py-5">
          <div className="bg-white rounded-4 shadow-sm d-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: 64, height: 64 }}>
            <span style={{ fontSize: '1.5rem' }}>🔐</span>
          </div>
          <h4 className="fw-bold mb-2">Sign in to view favorites</h4>
          <p className="text-muted mb-4">
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
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body text-center py-5">
          <div className="bg-white rounded-4 shadow-sm d-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: 64, height: 64 }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <h4 className="fw-bold mb-2">Something went wrong</h4>
          <p className="text-muted mb-4">{error}</p>
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
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body text-center py-5">
          <div className="bg-white rounded-4 shadow-sm d-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: 64, height: 64 }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
          </div>
          <h4 className="fw-bold mb-2">No favorites yet</h4>
          <p className="text-muted mb-4">
            Start exploring places and add them to your favorites!
          </p>
          <div className="d-flex flex-column gap-2">
            <a href="/bingo" className="btn btn-primary">
              Explore Bingo
            </a>
            <a href="/discover" className="btn btn-outline-secondary">
              Discover Places
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-white shadow-sm rounded-xl">
      <div className="card-body">
        {/* Header */}
        <div className="text-center mb-4">
          <h5 className="fw-bold mb-1">Your Favorites</h5>
          <p className="text-muted mb-0">
            {favorites.length} place{favorites.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Favorites grid */}
        <div className="row g-3">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="col-12">
              <div className="card bg-light border-0 rounded-3">
                <div className="card-body">
                  {/* Card header with icon and remove button */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ fontSize: '1.25rem' }}>
                        {getActivityIcon(favorite.category)}
                      </span>
                      <div>
                        <h6 className="fw-bold mb-0">{favorite.name}</h6>
                        <small className="text-muted text-capitalize">
                          {favorite.category.replace('_', ' ')}
                        </small>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      className="btn btn-outline-danger btn-sm"
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                      disabled={removingFavorite === favorite.id}
                    >
                      {removingFavorite === favorite.id ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-trash"></i>
                      )}
                    </button>
                  </div>
                  
                  {/* Action buttons */}
                  {favorite.maps_url && (
                    <div className="mt-2">
                      <a
                        href={favorite.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm w-100"
                      >
                        <i className="bi bi-geo-alt me-1"></i>
                        View on Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
