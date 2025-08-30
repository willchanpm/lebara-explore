import { createServerClient } from '@/lib/supabaseServer'

// Function to get the current month in 'YYYY-MM' format
// This will be used to query bingo tiles for the current month
function currentMonth() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}` // e.g. '2025-01'
}

// This is now a server component that fetches data on the server
export default async function BingoPage() {
  // Get the current month for querying bingo tiles
  const month = currentMonth()
  
  // Create a Supabase server client to fetch data
  const supabase = createServerClient()

  // Fetch bingo tiles for the current month, joined with places data
  // This gives us all the information we need for each tile
  const { data: tiles, error } = await supabase
    .from('bingo_tiles')
    .select(`
      id,
      label,
      description,
      place:places (
        id,
        name,
        category,
        slug,
        maps_url
      )
    `)
    .eq('month', month)

  // Log any errors that occur during the fetch
  if (error) {
    console.error('bingo_tiles fetch error', error)
  }

  // If no tiles are found for this month, show a friendly message
  if (!tiles || tiles.length === 0) {
    return (
      <div className="bingo-page">
        <div className="bingo-container">
          <div className="bingo-header">
            <h1 className="bingo-title">Bingo</h1>
            <p className="bingo-subtitle">No board for this month yet</p>
          </div>
          <div className="bingo-placeholder">
            <p>Check back next month for new challenges!</p>
          </div>
        </div>
      </div>
    )
  }

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
              Progress: 0 / {tiles.length}
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
          {tiles.map((tile) => {
            return (
              <button
                key={tile.id}
                className="bingo-square bingo-square-incomplete"
                data-tile-id={tile.id}
                data-place-id={tile.place?.id}
                data-place-name={tile.place?.name}
                data-place-category={tile.place?.category}
                data-place-slug={tile.place?.slug}
                data-place-maps-url={tile.place?.maps_url}
              >
                {/* Square content: label (we'll add emojis back later) */}
                <div className="bingo-content">
                  {/* Label text - this replaces the emoji for now */}
                  <div className="bingo-label">
                    {tile.label}
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
