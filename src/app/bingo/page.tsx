import { createServerClient } from '@/lib/supabaseServer'
import BingoClient from './BingoClient'

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
    <BingoClient 
      tiles={typedTiles} 
      month={month}
    />
  )
}
