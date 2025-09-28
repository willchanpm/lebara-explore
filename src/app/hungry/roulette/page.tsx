'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Define the structure of a place object from the database
// This interface matches what we expect from the public.places table
interface Place {
  id: number
  name: string
  category: string
  price_band: string
  url: string
  maps_url?: string // Optional field for Google Maps URL
  notes?: string // Optional field for additional information
  lat?: number // Optional latitude coordinate
  lon?: number // Optional longitude coordinate
  veg_friendly?: boolean // Optional field for vegetarian-friendly places
}

// Define the structure for the result state
interface RouletteResult {
  places: Place[] // Changed to array to handle multiple results
  loading: boolean
  error: string | null
}

export default function LunchRoulettePage() {
  // State for all the form controls - back to multi-select arrays
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]); // Selected price ranges
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Selected food categories
  const [vegFriendly, setVegFriendly] = useState<boolean>(false); // Veg-friendly toggle
  const [resultCount, setResultCount] = useState<number>(1); // Number of results to show
  
  // State for the roulette result
  const [result, setResult] = useState<RouletteResult>({
    places: [],
    loading: false,
    error: null
  });

  // Create a reference to the result section for auto-scrolling
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Price range options for chips - fixed width
  const PRICES = ['£','££','£££'];
  
  // Category options for chips - comprehensive list
  const CATEGORIES = [
    'Restaurant','Street Food','Market','Coffee','Bakery','Pub',
    'Bar','Landmark','Museum','Supermarket','Vegan'
  ];



  // Function to handle price selection (multi-select)
  const togglePrice = (price: string) => {
    setSelectedPrices(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price) // Remove if already selected
        : [...prev, price] // Add if not selected
    );
  };

  // Function to handle category selection (multi-select)
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) // Remove if already selected
        : [...prev, category] // Add if not selected
    );
  };

  // Function to handle reset - clear all filters (currently unused but kept for future use)
  // const handleReset = () => {
  //   setSelectedPrices([]);
  //   setSelectedCategories([]);
  //   setVegFriendly(false);
  //   setResultCount(1);
  //   setResult({ places: [], loading: false, error: null });
  // };

  // Function to handle the spin action
  const handleSpin = async () => {
    // Set loading state and clear previous results
    setResult({ places: [], loading: true, error: null });
    
    try {
      // Fetch all places from Supabase
      const { data, error } = await supabase
        .from('places')
        .select('*');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No places found in database');
      }
      
      // Debug: Log all places and their price bands
      console.log('All places from database:', data);
      console.log('Selected prices:', selectedPrices);
      console.log('Selected categories:', selectedCategories);
      console.log('Veg friendly:', vegFriendly);
      
      // Additional debugging: Log each place's price band specifically
      data.forEach((place: Place) => {
        console.log(`Place: ${place.name}, Price Band: "${place.price_band}", Category: ${place.category}`);
      });
      
      // Apply filters to the fetched data
      let filteredPlaces = data as Place[];
      
      // Filter by selected categories if any were chosen
      if (selectedCategories.length > 0) {
        filteredPlaces = filteredPlaces.filter(place => {
          // Map display category names to database format for comparison
          const categoryMap: { [key: string]: string } = {
            'Restaurant': 'restaurant',
            'Street Food': 'street_food',
            'Market': 'market',
            'Coffee': 'coffee',
            'Bakery': 'bakery',
            'Pub': 'pub',
            'Bar': 'bar',
            'Landmark': 'landmark',
            'Museum': 'museum',
            'Supermarket': 'supermarket',
            'Vegan': 'vegan'
          };
          // Convert selected display categories to database format
          const dbSelectedCategories = selectedCategories.map(displayCat => categoryMap[displayCat] || displayCat);
          return dbSelectedCategories.includes(place.category);
        });
        console.log('After category filtering:', filteredPlaces);
      }
      
      // Filter by selected price bands if any were chosen
      if (selectedPrices.length > 0) {
        console.log('Before price filtering, places:', filteredPlaces.map(p => ({ name: p.name, price_band: p.price_band })));
        filteredPlaces = filteredPlaces.filter(place => {
          const isIncluded = selectedPrices.includes(place.price_band);
          console.log(`Checking place ${place.name}: price_band="${place.price_band}", selectedPrices=${JSON.stringify(selectedPrices)}, included=${isIncluded}`);
          return isIncluded;
        });
        console.log('After price filtering:', filteredPlaces);
      }
      
      // Filter by veg-friendly if toggle is enabled
      if (vegFriendly) {
        filteredPlaces = filteredPlaces.filter(place => place.veg_friendly === true);
        console.log('After veg-friendly filtering:', filteredPlaces);
      }
      
      // Distance filtering - for now we'll keep all places that match price and category filters
      // In a real implementation, you'd calculate distance based on user location
      const distanceFiltered = filteredPlaces;
      
      // If still no results, show friendly message
      if (distanceFiltered.length === 0) {
        setResult({
          places: [],
          loading: false,
          error: 'No matches — try widening your filters'
        });
        
        // Scroll to result section even if there's an error
        setTimeout(() => {
          resultSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
        
        return;
      }
      
      // Randomly select N unique items from the filtered list
      const pool = [...distanceFiltered]; // Create a copy to avoid mutating original
      const n = Math.min(resultCount, pool.length);
      const picks: Place[] = [];
      
      while (picks.length < n && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selectedPlace = pool.splice(randomIndex, 1)[0];
        picks.push(selectedPlace);
      }
      
      console.log('Final selected places:', picks);
      console.log('Total filtered places available:', distanceFiltered.length);
      console.log('Requested count:', resultCount);
      
      // Set the result
      setResult({
        places: picks,
        loading: false,
        error: null
      });
      
      // Auto-scroll to the result section after a short delay to ensure the result is rendered
      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      
    } catch (error) {
      // Handle any errors that occurred during the process
      setResult({
        places: [],
        loading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      // Scroll to result section even if there's an error
      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };


  // Function to render a single place card
  const renderPlaceCard = (place: Place) => (
    <div className="text-center">
      <div className="text-success mb-2">🎉</div>
      <h4 className="fw-bold mb-2">{place.name}</h4>
      {place.price_band && (
        <p className="text-muted mb-3">Price: {place.price_band}</p>
      )}
      {place.notes && (
        <p className="text-muted mb-3">&ldquo;{place.notes}&rdquo;</p>
      )}
      <div className="d-flex gap-2 justify-content-center">
        <a 
          href={place.maps_url} 
          target="_blank" 
          rel="noopener" 
          className="btn btn-outline-secondary"
        >
          🗺️ Maps
        </a>
        <a 
          href={place.url} 
          target="_blank" 
          rel="noopener" 
          className="btn text-white" 
          style={{backgroundColor:'rgba(255,49,130,.85)'}}
        >
          🌐 Website
        </a>
      </div>
    </div>
  );

  // Function to render the result panel content
  const renderResultContent = () => {
    if (result.loading) {
      // Show loading state while waiting for roulette result
      return (
        <div className="text-center text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
          Finding a spot…
        </div>
      );
    }
    
    if (result.error) {
      // Show error state
      return (
        <div className="text-center">
          <div className="text-warning mb-2">⚠️</div>
          <h4 className="fw-bold mb-2">No matches found</h4>
          <p className="text-muted mb-0">Try broadening your filters and spin again!</p>
        </div>
      );
    }
    
    if (result.places.length > 0) {
      // Show the roulette results
      if (result.places.length === 1) {
        // Single result - show in the existing format
        return renderPlaceCard(result.places[0]);
      } else {
        // Multiple results - show as stacked cards
        return (
          <div>
            {result.places.map((place, index) => (
              <div key={`${place.id}-${index}`} className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body p-4">
                  {renderPlaceCard(place)}
                </div>
              </div>
            ))}
          </div>
        );
      }
    }
    
    // Default state - no result yet
    return (
      <div className="text-center">
        <div className="text-muted mb-2">🍽️</div>
        <h4 className="fw-bold mb-2">Ready to spin?</h4>
        <p className="text-muted mb-0">Set your preferences and click spin to get a random lunch spot!</p>
      </div>
    );
  };

  return (
    <div className="container py-4 pb-5">
      {/* Hero section */}
      <h1 className="display-5 fw-bold text-center mb-2">Lunch Roulette</h1>
      <p className="lead text-center text-muted mb-4">Set your preferences and let fate decide where you&apos;ll eat!</p>

      {/* Preferences card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          {/* Price Range Section */}
          <h5 className="fw-bold mb-3">Price Range</h5>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {PRICES.map((price) => {
              const isPriceActive = selectedPrices.includes(price);
              return (
                <button
                  key={price}
                  type="button"
                  className={`btn btn-sm rounded-pill ${isPriceActive ? 'text-white border-0' : 'text-dark border'} shadow-sm d-inline-flex align-items-center justify-content-center`}
                  style={{ 
                    width: 56, 
                    height: 32, 
                    ...(isPriceActive ? { backgroundColor:'rgba(255,49,130,.85)' } : { backgroundColor:'#fff' }) 
                  }}
                  onClick={() => togglePrice(price)}
                  aria-pressed={isPriceActive}
                >
                  {price}
                </button>
              );
            })}
          </div>

          {/* Food Categories Section */}
          <h5 className="fw-bold mb-3">Food Categories</h5>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((category) => {
              const isCatActive = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  className={`btn btn-sm rounded-pill ${isCatActive ? 'text-white border-0' : 'text-dark border'} shadow-sm`}
                  style={{ 
                    width: 'auto',
                    ...(isCatActive ? { backgroundColor:'rgba(255,49,130,.85)' } : { backgroundColor:'#fff' }) 
                  }}
                  onClick={() => toggleCategory(category)}
                  aria-pressed={isCatActive}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Veg-friendly switch on the right of label */}
          <div className="d-flex align-items-center justify-content-between my-2">
            <span className="text-muted">🌱 Veg-friendly</span>
            <div className="form-check form-switch m-0">
              <input 
                className="form-check-input switch-lg" 
                type="checkbox" 
                id="vegSwitch"
                checked={vegFriendly} 
                onChange={e => setVegFriendly(e.target.checked)} 
              />
            </div>
          </div>

          {/* Result count selector */}
          <div className="mt-2 mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <label className="form-label fw-semibold mb-0">How many options?</label>
              <div className="btn-group" role="group" aria-label="Result count">
                {[1,2,3].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`btn ${resultCount===n ? 'text-white' : 'btn-outline-secondary'}`}
                    style={resultCount===n ? { backgroundColor:'rgba(255,49,130,.85)', border:'none' } : {}}
                    onClick={()=>setResultCount(n)}
                    aria-pressed={resultCount===n}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Big CTA Button */}
          <button
            type="button"
            className="btn text-white fw-semibold w-100 py-3 rounded-4"
            style={{ backgroundColor:'rgba(255,49,130,.85)' }}
            onClick={handleSpin}
            disabled={result.loading}
            data-testid="spin-roulette"
          >
            {result.loading ? '⏳ Spinning...' : '🎲 Spin the Roulette'}
          </button>
        </div>
      </div>

      {/* Result/empty card */}
      <div className="card border-0 shadow-sm rounded-4 mb-5">
        <div className="card-body p-5 text-center">
          {renderResultContent()}
        </div>
      </div>
    </div>
  );
}
