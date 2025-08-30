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
  place: Place | null
  loading: boolean
  error: string | null
}

export default function LunchRoulettePage() {
  // State for all the form controls
  const [distance, setDistance] = useState(0.8); // Default distance in km
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]); // Selected price ranges
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Selected food categories
  
  // State for the roulette result
  const [result, setResult] = useState<RouletteResult>({
    place: null,
    loading: false,
    error: null
  });

  // Create a reference to the result section for auto-scrolling
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Broadwalk House coordinates as specified in requirements
  const ORIGIN = { lat: 51.5210, lon: -0.0812 };

  // Price range options
  const priceOptions = ['£', '££', '£££'];
  
  // Category options - Added veg-friendly as a category
  const categoryOptions = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'street_food', label: 'Street Food' },
    { value: 'market', label: 'Market' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'pub', label: 'Pub' },
    { value: 'veg_friendly', label: '🌱 Veg-friendly' }
  ];

  // Utility function to calculate haversine distance between two points in kilometers
  // This is a mathematical formula to find the great-circle distance between two points on a sphere
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Convert degrees to radians (Math.PI / 180 converts degrees to radians)
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert coordinates to radians
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    // Apply haversine formula
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Return distance in kilometers
    return R * c;
  };

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

  // Function to handle the spin action
  const handleSpin = async () => {
    // Set loading state and clear previous results
    setResult({ place: null, loading: true, error: null });
    
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
      
      // Apply filters to the fetched data
      let filteredPlaces = data as Place[];
      
      // Filter by selected categories if any were chosen
      if (selectedCategories.length > 0) {
        filteredPlaces = filteredPlaces.filter(place => {
          // Special handling for veg_friendly category
          if (selectedCategories.includes('veg_friendly')) {
            return place.veg_friendly === true;
          }
          // For other categories, check if they match the place category
          return selectedCategories.includes(place.category);
        });
      }
      
      // Filter by selected price bands if any were chosen
      if (selectedPrices.length > 0) {
        filteredPlaces = filteredPlaces.filter(place => 
          selectedPrices.includes(place.price_band)
        );
      }
      
      // Filter by distance if distance slider is set
      let distanceFiltered = filteredPlaces;
      if (distance > 0) {
        // First, filter out places without coordinates
        const placesWithCoords = filteredPlaces.filter(place => 
          place.lat !== null && place.lat !== undefined && 
          place.lon !== null && place.lon !== undefined
        );
        
        // Then apply distance filter
        distanceFiltered = placesWithCoords.filter(place => {
          const placeDistance = haversineDistance(
            ORIGIN.lat, 
            ORIGIN.lon, 
            place.lat!, 
            place.lon!
          );
          return placeDistance <= distance;
        });
      }
      
      // If distance filtering resulted in no results, fall back to ignoring distance
      if (distanceFiltered.length === 0 && distance > 0) {
        console.log('No results with distance filter, falling back to ignoring distance');
        distanceFiltered = filteredPlaces;
      }
      
      // If still no results, show friendly message
      if (distanceFiltered.length === 0) {
        setResult({
          place: null,
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
      
      // Randomly select one item from the filtered list
      const randomIndex = Math.floor(Math.random() * distanceFiltered.length);
      const selectedPlace = distanceFiltered[randomIndex];
      
      // Set the result
      setResult({
        place: selectedPlace,
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
        place: null,
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

  // Function to handle re-roll (get another random place with same filters)
  const handleReroll = () => {
    // Re-run the spin logic with the same filters
    handleSpin();
  };

  // Function to open the selected place in Google Maps
  const openInMaps = (mapsUrl: string) => {
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
    }
  };

  // Function to render the result panel content
  const renderResultContent = () => {
    if (result.loading) {
      // Show loading state while waiting for roulette result
      return (
        <div className="loading-container">
          <div className="loading-spinner">
            <span className="loading-emoji">⏳</span>
          </div>
          <h3 className="loading-title">
            Spinning the roulette...
          </h3>
          <p className="loading-text">
            Finding a random spot within your criteria!
          </p>
        </div>
      );
    }
    
    if (result.error) {
      // Show error state
      return (
        <div className="error-container">
          <div className="error-spinner">
            <span className="error-emoji">⚠️</span>
          </div>
          <h3 className="error-title">
            {result.error}
          </h3>
          <p className="error-text">
            Try adjusting your filters and spinning again!
          </p>
        </div>
      );
    }
    
    if (result.place) {
      // Show the roulette result
      return (
        <div className="roulette-result">
          {/* Success icon and title */}
          <div className="success-container">
            <div className="success-spinner">
              <span className="success-emoji">🎯</span>
            </div>
            <h3 className="success-title">
              Lunch Roulette Result!
            </h3>
            
            {/* Place badges */}
            <div className="result-badges">
              <span className="badge-category">
                {result.place.category.replace('_', ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
              <span className="badge-price">
                {result.place.price_band}
              </span>
              {result.place.veg_friendly && (
                <span className="badge-veg">
                  🌱 Veg-friendly
                </span>
              )}
            </div>
          </div>
          
          {/* Place details */}
          <div className="place-details">
            <h4 className="place-name">
              {result.place.name}
            </h4>
            
            {/* AI explanation */}
            <div className="ai-explanation">
              <p className="explanation-text">
                &ldquo;This spot matches your criteria perfectly! It&apos;s within your distance range and meets your price and category preferences.&rdquo;
              </p>
            </div>
            
            {/* Notes if present */}
            {result.place.notes && (
              <div className="place-notes">
                <p className="notes-text">&ldquo;{result.place.notes}&rdquo;</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="action-buttons">
              <button
                onClick={() => openInMaps(result.place!.maps_url!)}
                className="maps-button"
                aria-label={`Open ${result.place!.name} in Google Maps`}
              >
                🗺️ Open in Maps
              </button>
              <button
                onClick={handleSpin}
                className="spin-again-button"
                aria-label="Spin the roulette again with the same filters"
              >
                🎲 Spin Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Default state - no result yet
    return (
              <div className="default-container">
          <div className="default-spinner">
            <span className="default-emoji">🍽️</span>
          </div>
          <h3 className="default-title">
            Ready to spin?
          </h3>
          <p className="default-text">
            Set your preferences and click spin to get a random lunch spot!
          </p>
        </div>
    );
  };

  return (
    <div className="roulette-page">
      {/* Main content container */}
      <main className="roulette-container">
        {/* Page title */}
        <div className="roulette-header">
          <h1 className="roulette-title">
            Lunch Roulette
          </h1>
          <p className="roulette-subtitle">
            Set your preferences and let fate decide where you&apos;ll eat!
          </p>
        </div>

        {/* Controls section */}
        <div className="roulette-controls">
          {/* Distance slider */}
          <div className="distance-section">
            <label htmlFor="distance" className="distance-label">
              Maximum Distance
            </label>
            <div className="distance-controls">
              <input
                type="range"
                id="distance"
                min="0.1"
                max="2.0"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value))}
                className="distance-slider"
              />
              <span className="distance-value">
                {distance} km
              </span>
            </div>
          </div>

          {/* Price chips */}
          <div className="price-section">
            <label className="price-label">
              Price Range
            </label>
            <div className="price-chips">
              {priceOptions.map((price) => (
                <button
                  key={price}
                  onClick={() => togglePrice(price)}
                  className={`price-chip ${selectedPrices.includes(price) ? 'price-chip-active' : 'price-chip-inactive'}`}
                  aria-label={`Select ${price} price range`}
                  aria-pressed={selectedPrices.includes(price)}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          {/* Category chips */}
          <div className="category-section">
            <label className="category-label">
              Food Categories
            </label>
            <div className="category-chips">
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  onClick={() => toggleCategory(category.value)}
                  className={`category-chip ${selectedCategories.includes(category.value) ? 'category-chip-active' : 'category-chip-inactive'}`}
                  aria-label={`Select ${category.label} category`}
                  aria-pressed={selectedCategories.includes(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTA - Spin button */}
          <button
            onClick={handleSpin}
            disabled={result.loading}
            className="spin-button"
            aria-label="Spin the lunch roulette with current filters"
          >
            {result.loading ? '⏳ Spinning...' : '🎲 Spin the Roulette'}
          </button>
        </div>

        {/* Result panel */}
        <div ref={resultSectionRef} className="result-panel">
          {renderResultContent()}
        </div>
      </main>
    </div>
  );
}
