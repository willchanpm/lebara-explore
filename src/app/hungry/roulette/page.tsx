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
      
      // Debug: Log all places and their price bands
      console.log('All places from database:', data);
      console.log('Selected prices:', selectedPrices);
      console.log('Selected categories:', selectedCategories);
      
      // Additional debugging: Log each place's price band specifically
      data.forEach((place: Place) => {
        console.log(`Place: ${place.name}, Price Band: "${place.price_band}", Category: ${place.category}`);
      });
      
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
      
      // Distance filtering removed - now using all places that match price and category filters
      const distanceFiltered = filteredPlaces;
      
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
      
      console.log('Final selected place:', selectedPlace);
      console.log('Total filtered places available:', distanceFiltered.length);
      
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
          {/* Place details */}
          <div className="place-details">
            <h4 className="place-name" style={{ textAlign: 'center' }}>
              {result.place.name}
            </h4>
            
            {/* Place badges */}
            <div className="result-badges">
              <span className="badge-price">
                {result.place.price_band}
              </span>
              <span className="badge-category">
                {result.place.category.replace('_', ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
              {result.place.veg_friendly && (
                <span className="badge-veg">
                  🌱 Veg-friendly
                </span>
              )}
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
                onClick={handleReroll}
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
