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
              onClick={resetProgress}
              className="reset-button"
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
          {BINGO_SQUARES.map((square) => {
            const isCompleted = completedSquares.has(square.id)
            
            return (
              <button
                key={square.id}
                onClick={() => toggleSquare(square.id)}
                className={`bingo-square ${isCompleted ? 'bingo-square-completed' : 'bingo-square-incomplete'}`}
              >
                {/* Full tile overlay for completed squares with checkmark */}
                {isCompleted && (
                  <div className="bingo-overlay">
                    <div className="bingo-checkmark">
                      ✓
                    </div>
                  </div>
                )}
                
                {/* Square content: emoji and label */}
                <div className="bingo-content">
                  {/* Large emoji at the top */}
                  <div className="bingo-emoji">
                    {square.emoji}
                  </div>
                  
                  {/* Label text below emoji */}
                  <div className="bingo-label">
                    {square.label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Completion message when all squares are done */}
        {completedCount === totalCount && (
          <div className="bingo-completion">
            <div className="completion-emoji">🎉</div>
            <h3 className="completion-title">Bingo!</h3>
            <p className="completion-text">Congratulations! You&apos;ve completed all the challenges!</p>
          </div>
        )}
      </div>
    </div>
  )
}
