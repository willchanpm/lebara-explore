'use client';

import { useState } from 'react';

// Define the structure of a place object from the database
// This interface matches what we expect from the public.places table
interface Place {
  id: number;
  slug: string;
  name: string;
  category: string;
  price_band: string;
  url: string;
  maps_url?: string; // Optional field for Google Maps URL
  notes?: string; // Optional field for additional information
  lat?: number; // Optional latitude coordinate
  lon?: number; // Optional longitude coordinate
  veg_friendly?: boolean; // Optional field for vegetarian-friendly places
}

// Define the structure for the AI response
interface AIResponse {
  places: Place[];
  explanations: string[];
}

// Define the structure for the result state
interface AIResult {
  data: AIResponse | null;
  loading: boolean;
  error: string | null;
}

export default function AskAIPage() {
  // State for all the form controls
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]); // Selected mood chips
  const [userInput, setUserInput] = useState(''); // User's text input
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]); // Selected price ranges
  const [vegFriendly, setVegFriendly] = useState(false); // Vegetarian toggle
  
  // State for the AI result
  const [result, setResult] = useState<AIResult>({
    data: null,
    loading: false,
    error: null
  });

  // Mood options for quick selection
  const moodOptions = [
    { value: 'quick', label: 'Quick', emoji: '⚡' },
    { value: 'cozy', label: 'Cozy', emoji: '🕯️' },
    { value: 'cheap', label: 'Cheap', emoji: '💰' },
    { value: 'close', label: 'Close', emoji: '📍' },
    { value: 'impress', label: 'Impress', emoji: '✨' },
    { value: 'outdoor', label: 'Outdoor', emoji: '🌳' }
  ];

  // Price range options
  const priceOptions = ['£', '££', '£££'];

  // Function to handle mood selection (multi-select)
  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood) // Remove if already selected
        : [...prev, mood] // Add if not selected
    );
  };

  // Function to handle price selection (multi-select)
  const togglePrice = (price: string) => {
    setSelectedPrices(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price) // Remove if already selected
        : [...prev, price] // Add if not selected
    );
  };

  // Function to build the prompt from user input and selected moods
  const buildPrompt = (): string => {
    let prompt = userInput.trim();
    
    // Add selected moods to the prompt
    if (selectedMoods.length > 0) {
      const moodText = selectedMoods.join(', ');
      if (prompt) {
        prompt += `. Also looking for: ${moodText}`;
      } else {
        prompt = moodText;
      }
    }
    
    return prompt;
  };

  // Function to handle the suggest action
  const handleSuggest = async () => {
    const prompt = buildPrompt();
    
    // Validate that we have some input
    if (!prompt) {
      setResult({
        data: null,
        loading: false,
        error: 'Please tell us what you\'re looking for or select some mood chips!'
      });
      return;
    }

    // Set loading state and clear previous results
    setResult({ data: null, loading: true, error: null });
    
    try {
      // Prepare the request payload
      const requestBody = {
        prompt: prompt,
        filters: {
          priceRanges: selectedPrices.length > 0 ? selectedPrices : undefined,
          vegFriendly: vegFriendly
        }
      };

      // Call our AI API endpoint
      const response = await fetch('/api/lunch-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      
      // Set the successful result
      setResult({
        data: data,
        loading: false,
        error: null
      });
      
    } catch (error) {
      // Handle any errors that occurred during the API call
      setResult({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  // Function to handle re-roll (get new suggestions with same prompt)
  const handleReroll = () => {
    // Re-run the suggest logic with the same inputs
    handleSuggest();
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
      // Show loading state while waiting for AI response
      return (
        <div className="loading-container">
          <div className="loading-spinner">
            <span className="loading-emoji">🤖</span>
          </div>
          <h3 className="loading-title">
            AI is thinking...
          </h3>
          <p className="loading-text">
            Analyzing your preferences and finding the perfect spots!
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
            Try adjusting your request and clicking suggest again!
          </p>
        </div>
      );
    }
    
    if (result.data && result.data.places.length > 0) {
      // Show the AI suggestions
      return (
        <div className="ai-suggestions">
          {/* Header with re-roll button */}
          <div className="suggestions-header">
            <h3 className="suggestions-title">
              AI Suggestions
            </h3>
            <button
              onClick={handleReroll}
              className="reroll-button"
              aria-label="Get new AI suggestions with the same prompt"
            >
              🎲 Re-roll
            </button>
          </div>
          
          {/* Place cards */}
          <div className="place-cards">
            {result.data.places.map((place, index) => (
              <div key={place.id} className="place-card-ai">
                {/* Place header */}
                <div className="place-header-ai">
                  <div className="place-info-ai">
                    <h4 className="place-name-ai">
                      {place.name}
                    </h4>
                    
                    {/* Category and price badges */}
                    <div className="place-badges">
                      <span className="badge-category">
                        {place.category.replace('_', ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                      <span className="badge-price">
                        {place.price_band}
                      </span>
                      {place.veg_friendly && (
                        <span className="badge-veg">
                          🌱 Veg-friendly
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Open in Maps button */}
                  {place.maps_url && (
                    <button
                      onClick={() => openInMaps(place.maps_url!)}
                      className="maps-button"
                      aria-label={`Open ${place.name} in Google Maps`}
                    >
                      🗺️ Maps
                    </button>
                  )}
                </div>
                
                {/* AI explanation */}
                {result.data?.explanations[index] && (
                  <div className="ai-explanation">
                    <p className="explanation-text">
                      &ldquo;{result.data.explanations[index]}&rdquo;
                    </p>
                  </div>
                )}
                
                {/* Notes if present */}
                {place.notes && (
                  <div className="place-notes-ai">
                    <p className="notes-text">&ldquo;{place.notes}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Default state - no result yet
    return (
              <div className="default-container">
          <div className="default-spinner">
            <span className="default-emoji">🤖</span>
          </div>
          <h3 className="default-title">
            Suggestions will appear here
          </h3>
          <p className="default-text">
            Tell us what you&apos;re looking for and click suggest to get started!
          </p>
        </div>
    );
  };

  return (
    <div className="ai-page">
      {/* Main content container */}
      <main className="ai-container">
        {/* Page title */}
        <div className="ai-header">
          <h1 className="ai-title">
            Ask the AI
          </h1>
          <p className="ai-subtitle">
            Tell us your mood or constraints. We&apos;ll suggest a spot nearby.
          </p>
        </div>

        {/* Controls section */}
        <div className="ai-controls">
          {/* Quick mood chips */}
          <div className="mood-section">
            <label className="mood-label">
              Quick Mood
            </label>
            <div className="mood-chips">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => toggleMood(mood.value)}
                  className={`mood-chip ${selectedMoods.includes(mood.value) ? 'mood-chip-active' : 'mood-chip-inactive'}`}
                  aria-label={`Select ${mood.label} mood`}
                  aria-pressed={selectedMoods.includes(mood.value)}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea for user input */}
          <div className="input-section">
            <label htmlFor="user-input" className="input-label">
              Tell us more
            </label>
            <textarea
              id="user-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g. craving noodles, 10-minute walk, under £15"
              rows={3}
              className="ai-textarea"
              aria-label="Describe your lunch preferences, mood, or constraints"
            />
          </div>

          {/* Optional constraints row */}
          <div className="constraints-section">
            <label className="constraints-label">
              Optional Constraints
            </label>
            
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

            {/* Veg-friendly toggle */}
            <div className="veg-toggle-section">
              <label htmlFor="veg-friendly-ai" className="veg-label">
                Veg-friendly only
              </label>
              <button
                id="veg-friendly-ai"
                onClick={() => setVegFriendly(!vegFriendly)}
                className={`veg-toggle ${vegFriendly ? 'veg-toggle-active' : 'veg-toggle-inactive'}`}
                aria-label="Toggle vegetarian-friendly filter"
                aria-pressed={vegFriendly}
              >
                <span
                  className={`veg-toggle-slider ${vegFriendly ? 'veg-toggle-slider-active' : 'veg-toggle-slider-inactive'}`}
                />
              </button>
            </div>
          </div>

          {/* Primary CTA - Suggest button */}
          <button
            onClick={handleSuggest}
            disabled={result.loading}
            className="suggest-button"
            aria-label="Get AI-powered lunch suggestions based on your preferences"
          >
            {result.loading ? '⏳ Thinking...' : '🤖 Suggest'}
          </button>
        </div>

        {/* Result panel */}
        <div className="result-panel">
          {renderResultContent()}
        </div>
      </main>
    </div>
  );
}
