'use client'

import { useState, useEffect } from 'react'
import BingoModal from '@/components/BingoModal'

// Define TypeScript interfaces for our data structures
interface Place {
  id: string
  name: string
  category: string
  slug: string
  maps_url: string
}

interface BingoTile {
  id: string
  label: string
  description: string | null
  place: Place | null
}

// Interface for completion data
interface BingoCompletionData {
  image: string | null
  rating: number
  comment: string
  photoUrl?: string | null
}

// Interface for stored completion data
interface StoredCompletionData extends BingoCompletionData {
  completedAt: string
}

// Props for the BingoClient component
interface BingoClientProps {
  tiles: BingoTile[]
  month: string
}



// Function to get the appropriate icon based on the place category
// This maps different types of activities to relevant emojis
function getActivityIcon(category: string | null): string {
  if (!category) return '🍽️' // Default food icon
  
  // Convert category to lowercase for case-insensitive matching
  const lowerCategory = category.toLowerCase()
  
  // Map different categories to appropriate icons
  if (lowerCategory.includes('coffee') || lowerCategory.includes('cafe')) {
    return '☕'
  } else if (lowerCategory.includes('restaurant') || lowerCategory.includes('dining')) {
    return '🍽️'
  } else if (lowerCategory.includes('rooftop')) {
    return '🍸'
  } else if (lowerCategory.includes('bar') || lowerCategory.includes('pub')) {
    return '🍺'
  } else if (lowerCategory.includes('pizza')) {
    return '🍕'
  } else if (lowerCategory.includes('burger') || lowerCategory.includes('fast food')) {
    return '🍔'
  } else if (lowerCategory.includes('sushi') || lowerCategory.includes('japanese')) {
    return '🍣'
  } else if (lowerCategory.includes('taco') || lowerCategory.includes('mexican')) {
    return '🌮'
  } else if (lowerCategory.includes('ice cream') || lowerCategory.includes('dessert')) {
    return '🍦'
  } else if (lowerCategory.includes('bakery') || lowerCategory.includes('bread')) {
    return '🥐'
  } else if (lowerCategory.includes('salad') || lowerCategory.includes('healthy')) {
    return '🥗'
  } else if (lowerCategory.includes('bbq') || lowerCategory.includes('grill')) {
    return '🔥'
  } else if (lowerCategory.includes('seafood')) {
    return '🐟'
  } else if (lowerCategory.includes('italian')) {
    return '🍝'
  } else if (lowerCategory.includes('chinese') || lowerCategory.includes('asian')) {
    return '🥢'
  } else if (lowerCategory.includes('indian')) {
    return '🍛'
  } else if (lowerCategory.includes('thai')) {
    return '🍜'
  } else if (lowerCategory.includes('vegan') || lowerCategory.includes('vegetarian')) {
    return '🌱'
  } else if (lowerCategory.includes('food truck') || lowerCategory.includes('street food')) {
    return '🚚'
  } else if (lowerCategory.includes('farm')) {
    return '🌾'
  } else if (lowerCategory.includes('market')) {
    return '🎪'
  } else if (lowerCategory.includes('wine') || lowerCategory.includes('winery')) {
    return '🍷'
  } else if (lowerCategory.includes('brewery') || lowerCategory.includes('beer')) {
    return '🍺'
  } else if (lowerCategory.includes('deli') || lowerCategory.includes('sandwich')) {
    return '🥪'
  } else if (lowerCategory.includes('steakhouse') || lowerCategory.includes('meat')) {
    return '🥩'
  } else if (lowerCategory.includes('noodles') || lowerCategory.includes('ramen')) {
    return '🍜'
  } else if (lowerCategory.includes('curry')) {
    return '🍛'
  } else if (lowerCategory.includes('soup')) {
    return '🥣'
  } else if (lowerCategory.includes('breakfast') || lowerCategory.includes('brunch')) {
    return '🥞'
  } else if (lowerCategory.includes('lunch')) {
    return '🥪'
  } else if (lowerCategory.includes('dinner')) {
    return '🍽️'
  } else if (lowerCategory.includes('snack')) {
    return '🍿'
  } else if (lowerCategory.includes('drink') || lowerCategory.includes('beverage')) {
    return '🥤'
  } else {
    // Default icon for any other categories
    return '🍽️'
  }
}

// This is the client component that handles all the interactive functionality
export default function BingoClient({ tiles, month }: BingoClientProps) {
  // State variables for managing the component
  const [completedSquares, setCompletedSquares] = useState<Set<string>>(new Set())
  const [completionData, setCompletionData] = useState<Record<string, StoredCompletionData>>({})
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<BingoTile | null>(null)

  // Load saved progress when component mounts
  useEffect(() => {
    loadSavedProgress()
  }, [])

  // Function to load saved progress from localStorage
  const loadSavedProgress = () => {
    try {
      // Load completed squares
      const savedSquares = localStorage.getItem('lsx:bingo:v1')
      if (savedSquares) {
        const savedArray = JSON.parse(savedSquares)
        setCompletedSquares(new Set(savedArray))
        console.log('Loaded completed squares:', savedArray)
      }
      
      // Load completion data
      const savedCompletionData = localStorage.getItem('lsx:bingo:completion:v1')
      if (savedCompletionData) {
        setCompletionData(JSON.parse(savedCompletionData))
        console.log('Loaded completion data:', JSON.parse(savedCompletionData))
      }
    } catch (error) {
      console.warn('Failed to load bingo progress:', error)
    }
  }

  // Function to save progress to localStorage
  const saveProgress = () => {
    try {
      // Save completed squares
      const arrayToSave = Array.from(completedSquares)
      localStorage.setItem('lsx:bingo:v1', JSON.stringify(arrayToSave))
      console.log('Saved completed squares:', arrayToSave)
      
      // Save completion data
      localStorage.setItem('lsx:bingo:completion:v1', JSON.stringify(completionData))
      console.log('Saved completion data:', completionData)
    } catch (error) {
      console.warn('Failed to save bingo progress:', error)
    }
  }

  // Function to handle tile click
  const handleTileClick = (tile: BingoTile) => {
    if (completedSquares.has(tile.id)) {
      // If already completed, don't allow uncompleting
      // The tile is permanently completed once saved to Supabase
      return
    } else {
      // If not completed, open modal to complete it
      setSelectedTile(tile)
      setIsModalOpen(true)
    }
  }

  // Function to handle modal save
  const handleModalSave = async (data: BingoCompletionData) => {
    if (selectedTile) {
      console.log('Modal save called for tile:', selectedTile.id, 'with data:', data)
      
      // Add completion timestamp
      const completionDataWithTimestamp: StoredCompletionData = {
        ...data,
        completedAt: new Date().toISOString()
      }
      
      // Update completion data
      setCompletionData(prev => {
        const newData = {
          ...prev,
          [selectedTile.id]: completionDataWithTimestamp
        }
        console.log('Updated completion data:', newData)
        return newData
      })
      
      // Mark tile as completed
      const newCompletedSquares = new Set(completedSquares)
      newCompletedSquares.add(selectedTile.id)
      setCompletedSquares(newCompletedSquares)
      console.log('Updated completed squares:', Array.from(newCompletedSquares))
      
      // Save to localStorage
      saveProgress()
    }
  }

  // Function to reset all progress
  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
      setCompletedSquares(new Set())
      setCompletionData({})
      saveProgress()
    }
  }

  // Calculate progress
  const completedCount = completedSquares.size
  const totalCount = tiles.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <>
    <div className="container py-4 pb-5">
      {/* Header section with title and subtitle */}
      <div className="bingo-header">
        <h1 className="display-5 fw-bold text-center mb-2">Bingo</h1>
        <p className="lead text-center text-muted mb-4">Tick them off as you go</p>
      </div>
      
      {/* Progress section with Bootstrap card styling */}
      <div className="card shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          {/* Progress header row */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-medium text-muted">
              Progress: {completedCount} / {totalCount}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              onClick={resetProgress}
              disabled={completedCount === 0}
            >
              Reset
            </button>
          </div>
          
          {/* Bootstrap progress bar with smooth animation */}
          <div className="progress rounded-pill" style={{ height: '12px' }}>
            <div 
              className="progress-bar bg-primary"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              style={{ 
                width: `${progressPercentage}%`,
                transition: 'width 0.6s ease-in-out'
              }}
            >
              {/* Show percentage label when there's enough space */}
              {progressPercentage >= 15 && (
                <span className="text-white fw-medium" style={{ fontSize: '0.75rem' }}>
                  {Math.round(progressPercentage)}%
                </span>
              )}
              {/* Screen reader fallback */}
              <span className="visually-hidden">
                {completedCount} of {totalCount} challenges completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bingo grid with Bootstrap responsive columns */}
      <div className="row g-2 g-sm-3">
        {tiles.map((tile) => {
          const isCompleted = completedSquares.has(tile.id)
          const tileCompletionData = completionData[tile.id]
          
          return (
            <div key={tile.id} className="col-6 col-sm-4">
              <button
                className={`bingo-tile-card w-100 h-100 position-relative border-0 bg-white rounded-3 shadow-sm text-start ${isCompleted ? 'bingo-completed' : ''}`}
                onClick={() => handleTileClick(tile)}
                style={{ 
                  aspectRatio: '1',
                  cursor: isCompleted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '0.75rem' // Reduced from p-3 (1rem) to ~20% less
                }}
              >
                {/* Completion badge */}
                {isCompleted && (
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge bg-success rounded-pill">
                      ✓
                    </span>
                  </div>
                )}
                
                {/* Tile content - centered stack */}
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                  {/* Title (category) */}
                  <div className="fw-medium mb-2" style={{ fontSize: '0.875rem', lineHeight: '1.2' }}>
                    {tile.label}
                  </div>
                  
                  {/* Emoji/Icon */}
                  <div className="mb-2" style={{ fontSize: '1.5rem' }}>
                    {tile.place?.category ? getActivityIcon(tile.place.category) : '🍽️'}
                  </div>
                  
                  {/* Subtitle (hint) - clamped to 2 lines */}
                  {tile.description && (
                    <div 
                      className="text-muted"
                      style={{ 
                        fontSize: '0.625rem', // Reduced from 0.75rem (small) to 0.625rem
                        lineHeight: '1.2',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {tile.description}
                    </div>
                  )}
                  
                  {/* Show rating if completed */}
                  {isCompleted && tileCompletionData && (
                    <div className="mt-2 text-warning" style={{ fontSize: '0.75rem' }}>
                      {'★'.repeat(tileCompletionData.rating)}
                    </div>
                  )}
                </div>
                
                {/* Dim overlay for completed state */}
                {isCompleted && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 rounded-3"
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Completion message when all squares are done */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="card bg-success bg-opacity-10 border border-success mt-4">
          <div className="card-body text-center">
            <div className="fs-1 mb-2">🎉</div>
            <h3 className="card-title text-success">Bingo!</h3>
            <p className="card-text text-muted">Congratulations! You&apos;ve completed all the challenges!</p>
          </div>
        </div>
      )}
    </div>

    {/* Bingo Modal */}
    <BingoModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false)
        setSelectedTile(null)
      }}
      onSave={handleModalSave}
      tileLabel={selectedTile?.label || ''}
      tileId={selectedTile?.id || ''}
      boardMonth={month}
    />
    </>
  )
}
