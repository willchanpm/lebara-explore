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
    <div className="bingo-page">
      <div className="bingo-container">
        {/* Header section with title and subtitle */}
        <div className="bingo-header">
          <h1 className="bingo-title">Bingo</h1>
          <p className="bingo-subtitle">Tick them off as you go</p>

        </div>
        
        {/* Progress section with progress bar and reset button */}
        <div className="bingo-progress">
          <div className="progress-header">
            <span className="progress-text">
              Progress: {completedCount} / {totalCount}
            </span>
            <button
              className="reset-button"
              onClick={resetProgress}
            >
              Reset
            </button>
          </div>
          
          {/* Progress bar showing completion percentage */}
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Bingo grid - 3 columns on mobile, 4 columns on medium screens and up */}
        <div className="bingo-grid">
          {tiles.map((tile) => {
            const isCompleted = completedSquares.has(tile.id)
            const tileCompletionData = completionData[tile.id]
            
            return (
              <button
                key={tile.id}
                className={`bingo-square ${isCompleted ? 'bingo-square-completed' : 'bingo-square-incomplete'}`}
                onClick={() => handleTileClick(tile)}
              >
                {/* Square content with aligned title at top */}
                <div className="bingo-content">
                  {/* Title text - aligned at the top */}
                  <div className="bingo-title-text">
                    {tile.label}
                  </div>
                  
                  {/* Small icon between title and description */}
                  <div className="bingo-icon">
                    {tile.place?.category ? getActivityIcon(tile.place.category) : '🍽️'}
                  </div>
                  
                  {/* Description text if available */}
                  {tile.description && (
                    <div className="bingo-description">
                      {tile.description}
                    </div>
                  )}
                  
                  {/* Show rating if completed */}
                  {isCompleted && tileCompletionData && (
                    <div className="bingo-rating">
                      {'★'.repeat(tileCompletionData.rating)}
                    </div>
                  )}
                </div>
                
                {/* Completion overlay with pink checkmark */}
                {isCompleted && (
                  <div className="bingo-overlay">
                    <div className="bingo-checkmark">✓</div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Completion message when all squares are done */}
        {completedCount === totalCount && totalCount > 0 && (
          <div className="bingo-completion">
            <div className="completion-emoji">🎉</div>
            <h3 className="completion-title">Bingo!</h3>
            <p className="completion-text">Congratulations! You&apos;ve completed all the challenges!</p>
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
    </div>
  )
}
