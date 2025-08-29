'use client'

import { useState, useEffect } from 'react'

// Define the 12 Bingo squares with their unique identifiers, labels, and emojis
// Each square has an id (for tracking), label (description), and emoji (visual representation)
const BINGO_SQUARES = [
  { id: 'coffee', label: 'Coffee Shop', emoji: '☕' },
  { id: 'park', label: 'City Park', emoji: '🌳' },
  { id: 'museum', label: 'Museum', emoji: '🏛️' },
  { id: 'restaurant', label: 'New Restaurant', emoji: '🍽️' },
  { id: 'library', label: 'Public Library', emoji: '📚' },
  { id: 'market', label: 'Local Market', emoji: '🛒' },
  { id: 'theater', label: 'Movie Theater', emoji: '🎬' },
  { id: 'gallery', label: 'Art Gallery', emoji: '🎨' },
  { id: 'cafe', label: 'Café Visit', emoji: '☕' },
  { id: 'bookstore', label: 'Bookstore', emoji: '📖' },
  { id: 'garden', label: 'Botanical Garden', emoji: '🌸' },
  { id: 'bakery', label: 'Local Bakery', emoji: '🥐' }
]

export default function BingoPage() {
  // State to track which squares are completed
  // Using a Set for efficient lookups and to prevent duplicates
  const [completedSquares, setCompletedSquares] = useState<Set<string>>(new Set())

  // Load saved progress from localStorage when component mounts
  useEffect(() => {
    try {
      // Try to get saved data from localStorage using the specified key
      const saved = localStorage.getItem('lsx:bingo:v1')
      if (saved) {
        // Parse the saved JSON string back into an array
        const savedArray = JSON.parse(saved)
        // Convert the array back to a Set for efficient operations
        setCompletedSquares(new Set(savedArray))
      }
    } catch (error) {
      // If there's an error reading from localStorage, just start with empty progress
      console.warn('Failed to load bingo progress:', error)
    }
  }, [])

  // Save progress to localStorage whenever completedSquares changes
  useEffect(() => {
    try {
      // Convert Set to array for localStorage storage (Sets can't be stored directly)
      const arrayToSave = Array.from(completedSquares)
      // Save to localStorage with the specified key
      localStorage.setItem('lsx:bingo:v1', JSON.stringify(arrayToSave))
    } catch (error) {
      // If there's an error saving to localStorage, log it but don't crash
      console.warn('Failed to save bingo progress:', error)
    }
  }, [completedSquares])

  // Function to toggle a square's completion status
  const toggleSquare = (squareId: string) => {
    setCompletedSquares(prev => {
      const newSet = new Set(prev)
      if (newSet.has(squareId)) {
        // If square is completed, remove it (uncheck)
        newSet.delete(squareId)
      } else {
        // If square is not completed, add it (check)
        newSet.add(squareId)
      }
      return newSet
    })
  }

  // Function to reset all progress (clear all completed squares)
  const resetProgress = () => {
    // Show confirmation dialog before clearing
    if (window.confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
      setCompletedSquares(new Set())
    }
  }

  // Calculate progress for the progress bar
  const completedCount = completedSquares.size
  const totalCount = BINGO_SQUARES.length
  const progressPercentage = (completedCount / totalCount) * 100

  return (
    <div className="bg-bg">
      <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4 pb-20">
        {/* Header section with title and subtitle */}
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-2 text-brand-navy">Bingo</h1>
          <p className="text-sm font-medium text-muted">Tick them off as you go</p>
        </div>
        
        {/* Progress section with progress bar and reset button */}
        <div className="mb-6 p-4 bg-card rounded-2xl border border-border shadow-lebara">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">
              Progress: {completedCount} / {totalCount}
            </span>
            <button
              onClick={resetProgress}
              className="px-4 py-2 text-sm font-medium text-brand-accent hover:text-brand-accent-700 transition-all duration-200 rounded-xl border border-brand-accent/20 hover:bg-brand-accent/10 hover:border-brand-accent/40"
            >
              Reset
            </button>
          </div>
          
          {/* Progress bar showing completion percentage */}
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-brand-accent h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Bingo grid - 3 columns on mobile, 4 columns on medium screens and up */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-0">
          {BINGO_SQUARES.map((square) => {
            const isCompleted = completedSquares.has(square.id)
            
            return (
              <button
                key={square.id}
                onClick={() => toggleSquare(square.id)}
                className={`
                  relative rounded-2xl p-3 text-center border transition-all duration-200 overflow-hidden
                  ${isCompleted 
                    ? 'ring-2 ring-brand-accent bg-brand-accent/10' 
                    : 'bg-card text-text border-border hover:bg-brand/20'
                  }
                `}
              >
                {/* Full tile overlay for completed squares with checkmark */}
                {isCompleted && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-brand-accent/20 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-brand-accent text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lebara" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
                      ✓
                    </div>
                  </div>
                )}
                
                {/* Square content: emoji and label */}
                <div className="space-y-2">
                  {/* Large emoji at the top */}
                  <div className="text-3xl">
                    {square.emoji}
                  </div>
                  
                  {/* Label text below emoji */}
                  <div className="text-xs font-medium leading-tight">
                    {square.label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Completion message when all squares are done */}
        {completedCount === totalCount && (
          <div className="mt-6 p-4 bg-brand-accent/10 border border-brand-accent rounded-2xl text-center">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-lg font-bold text-brand-accent mb-1">Bingo!</h3>
            <p className="text-sm text-muted">Congratulations! You&apos;ve completed all the challenges!</p>
          </div>
        )}
      </div>
    </div>
  )
}
