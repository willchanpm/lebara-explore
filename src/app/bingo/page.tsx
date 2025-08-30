import { createServerClient } from '@/lib/supabaseServer'

// Define TypeScript interfaces for our data structures
// This helps TypeScript understand the shape of our data
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

// Interface for the raw Supabase response
// This represents what Supabase actually returns before we transform it
interface RawBingoTile {
  id: string
  label: string
  description: string | null
  month: string
  place_id: string
}

// Function to get the current month in 'YYYY-MM' format
// This will be used to query bingo tiles for the current month
function currentMonth() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}` // e.g. '2025-01'
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

// This is now a server component that fetches data on the server
export default async function BingoPage() {
  // Get the current month for querying bingo tiles
  let month = currentMonth()
  
  // Create a Supabase server client to fetch data
  const supabase = createServerClient()

  // First, try to fetch bingo tiles for the current month
  // We need to manually join the places table using place_id
  let { data: tiles } = await supabase
    .from('bingo_tiles')
    .select(`
      id,
      label,
      description,
      month,
      place_id
    `)
    .eq('month', month)

  // If no tiles found for current month, try to fetch from the most recent month with tiles
  if (!tiles || tiles.length === 0) {
    // First, find the most recent month that has tiles
    const { data: recentMonthData, error: recentMonthError } = await supabase
      .from('bingo_tiles')
      .select('month')
      .order('month', { ascending: false })
      .limit(1)
    
    if (recentMonthError) {
      console.error('Error finding recent month:', recentMonthError)
    } else if (recentMonthData && recentMonthData.length > 0) {
      const fallbackMonth = recentMonthData[0].month
      
      // Fetch tiles for the fallback month
      const { data: fallbackTiles, error: fallbackError } = await supabase
        .from('bingo_tiles')
        .select(`
          id,
          label,
          description,
          month,
          place_id
        `)
        .eq('month', fallbackMonth)
      
      if (fallbackError) {
        console.error('Fallback month fetch error:', fallbackError)
      } else {
        tiles = fallbackTiles
        // Update the month variable to reflect what we're actually showing
        month = fallbackMonth
      }
    }
  }

  // Now we need to fetch the place data for each tile using the place_id
  // Let's get all unique place_ids from the tiles
  const placeIds = [...new Set((tiles || []).map(tile => tile.place_id).filter(Boolean))]
  
  // Fetch all the places data
  let placesData: Record<string, Place> = {}
  if (placeIds.length > 0) {
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name, category, slug, maps_url')
      .in('id', placeIds)
    
    if (placesError) {
      console.error('Error fetching places:', placesError)
    } else {
      // Create a lookup map for quick access
      placesData = (places || []).reduce((acc: Record<string, Place>, place: Place) => {
        acc[place.id] = place
        return acc
      }, {})
    }
  }
  
  // Transform the data to match our expected structure
  // Now we can properly map each tile to its place data
  const typedTiles: BingoTile[] = (tiles || []).map((tile: RawBingoTile) => ({
    id: tile.id,
    label: tile.label,
    description: tile.description,
    place: tile.place_id ? placesData[tile.place_id] || null : null
  }))

  // If no tiles are found at all, show a friendly message
  if (typedTiles.length === 0) {
    return (
      <div className="bingo-page">
        <div className="bingo-container">
          <div className="bingo-header">
            <h1 className="bingo-title">Bingo</h1>
            <p className="bingo-subtitle">No board available yet</p>
          </div>
          <div className="bingo-placeholder">
            <p>Check back soon for new challenges!</p>
          </div>
        </div>
      </div>
    )
  }

  // Note: month variable is used in the month note display below

  return (
    <div className="bingo-page">
      <div className="bingo-container">
        {/* Header section with title and subtitle */}
        <div className="bingo-header">
          <h1 className="bingo-title">Bingo</h1>
          <p className="bingo-subtitle">Tick them off as you go</p>
          {/* Show which month's board we're displaying */}
          {month !== currentMonth() && (
            <p className="bingo-month-note">Showing board from {month}</p>
          )}
        </div>
        
        {/* Progress section with progress bar and reset button */}
        <div className="bingo-progress">
          <div className="progress-header">
            <span className="progress-text">
              Progress: 0 / {typedTiles.length}
            </span>
            <button
              className="reset-button"
              id="reset-button"
            >
              Reset
            </button>
          </div>
          
          {/* Progress bar showing completion percentage */}
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: '0%' }}
              id="progress-fill"
            />
          </div>
        </div>

        {/* Bingo grid - 3 columns on mobile, 4 columns on medium screens and up */}
        <div className="bingo-grid">
          {typedTiles.map((tile) => {
            return (
              <button
                key={tile.id}
                className="bingo-square bingo-square-incomplete"
                data-tile-id={tile.id}
                data-place-id={tile.place?.id || ''}
                data-place-name={tile.place?.name || ''}
                data-place-category={tile.place?.category || ''}
                data-place-slug={tile.place?.slug || ''}
                data-place-maps-url={tile.place?.maps_url || ''}
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
                </div>
              </button>
            )
          })}
        </div>

        {/* Completion message when all squares are done - will be shown by JavaScript */}
        <div className="bingo-completion" id="bingo-completion" style={{ display: 'none' }}>
          <div className="completion-emoji">🎉</div>
          <h3 className="completion-title">Bingo!</h3>
          <p className="completion-text">Congratulations! You&apos;ve completed all the challenges!</p>
        </div>
      </div>

      {/* Client-side JavaScript to handle the interactive functionality */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // State to track which squares are completed
            // Using a Set for efficient lookups and to prevent duplicates
            let completedSquares = new Set()

            // Load saved progress from localStorage when page loads
            try {
              const saved = localStorage.getItem('lsx:bingo:v1')
              if (saved) {
                const savedArray = JSON.parse(saved)
                completedSquares = new Set(savedArray)
                updateProgress()
              }
            } catch (error) {
              console.warn('Failed to load bingo progress:', error)
            }

            // Save progress to localStorage whenever completedSquares changes
            function saveProgress() {
              try {
                const arrayToSave = Array.from(completedSquares)
                localStorage.setItem('lsx:bingo:v1', JSON.stringify(arrayToSave))
              } catch (error) {
                console.warn('Failed to save bingo progress:', error)
              }
            }

            // Function to toggle a square's completion status
            function toggleSquare(squareId) {
              if (completedSquares.has(squareId)) {
                completedSquares.delete(squareId)
              } else {
                completedSquares.add(squareId)
              }
              
              // Update the visual state
              updateSquareVisual(squareId)
              updateProgress()
              saveProgress()
            }

            // Function to update the visual state of a square
            function updateSquareVisual(squareId) {
              const square = document.querySelector(\`[data-tile-id="\${squareId}"]\`)
              if (square) {
                const isCompleted = completedSquares.has(squareId)
                square.className = isCompleted ? 'bingo-square bingo-square-completed' : 'bingo-square bingo-square-incomplete'
                
                // Add or remove the overlay
                let overlay = square.querySelector('.bingo-overlay')
                if (isCompleted && !overlay) {
                  overlay = document.createElement('div')
                  overlay.className = 'bingo-overlay'
                  overlay.innerHTML = '<div class="bingo-checkmark">✓</div>'
                  square.appendChild(overlay)
                } else if (!isCompleted && overlay) {
                  overlay.remove()
                }
              }
            }

            // Function to update progress display
            function updateProgress() {
              const completedCount = completedSquares.size
              const totalCount = document.querySelectorAll('.bingo-square').length
              const progressText = document.querySelector('.progress-text')
              const progressFill = document.getElementById('progress-fill')
              const completionMessage = document.getElementById('bingo-completion')
              
              if (progressText) {
                progressText.textContent = \`Progress: \${completedCount} / \${totalCount}\`
              }
              
              if (progressFill) {
                const progressPercentage = (completedCount / totalCount) * 100
                progressFill.style.width = \`\${progressPercentage}%\`
              }
              
              if (completionMessage) {
                completionMessage.style.display = completedCount === totalCount ? 'block' : 'none'
              }
            }

            // Function to reset all progress (clear all completed squares)
            function resetProgress() {
              if (window.confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
                completedSquares.clear()
                
                // Update all squares visually
                document.querySelectorAll('.bingo-square').forEach(square => {
                  const tileId = square.getAttribute('data-tile-id')
                  updateSquareVisual(tileId)
                })
                
                updateProgress()
                saveProgress()
              }
            }

            // Add click event listeners to all bingo squares
            document.addEventListener('DOMContentLoaded', function() {
              document.querySelectorAll('.bingo-square').forEach(square => {
                square.addEventListener('click', function() {
                  const tileId = this.getAttribute('data-tile-id')
                  toggleSquare(tileId)
                })
              })
              
              // Add click event listener to reset button
              const resetButton = document.getElementById('reset-button')
              if (resetButton) {
                resetButton.addEventListener('click', resetProgress)
              }
              
              // Update initial progress display
              updateProgress()
            })
          `
        }}
      />
    </div>
  )
}
