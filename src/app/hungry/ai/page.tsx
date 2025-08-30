'use client';

import { useState } from 'react';



// Define the structure for the AI response
interface AIResponse {
  result: string;
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
  const [widerSearch, setWiderSearch] = useState(false); // Wider search toggle
  const [searchCollapsed, setSearchCollapsed] = useState(false); // Search criteria collapsed state
  
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



  // Function to handle the suggest action
  const handleSuggest = async () => {
    // Validate that we have some input
    if (!userInput && selectedMoods.length === 0) {
      setResult({
        data: null,
        loading: false,
        error: 'Please tell us what you\'re looking for or select some mood chips!'
      });
      return;
    }

    // Set loading state and clear previous results
    setResult({ data: null, loading: true, error: null });
    
    // Collapse search criteria to make room for results
    setSearchCollapsed(true);
    
    try {
      // Prepare the request payload
      const requestBody = {
        quickMood: selectedMoods,
        notes: userInput,
        priceBand: selectedPrices.length > 0 ? selectedPrices[0] : undefined,
        vegFriendly: vegFriendly,
        widerSearch: widerSearch
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

  // Function to toggle search criteria visibility
  const toggleSearchCriteria = () => {
    setSearchCollapsed(!searchCollapsed);
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
    
    if (result.data && result.data.result) {
      // Show the AI response
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
          
                    {/* AI response text */}
          <div className="ai-response">
            <div className="response-text">
              {result.data.result
                .split('\n')
                .filter(line => line.trim() !== '') // Remove empty lines
                .map((line, index) => {
                  // Parse markdown formatting - these variables help identify formatting but aren't used in current styling
                  // const hasBold = line.includes('**');
                  // const hasItalic = line.includes('*');
                  
                  // Determine the line type for styling
                  const isRestaurantName = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/); // Numbered items with bold names
                  const isSubHeader = line.match(/^-\s+\w+:/); // Bullet points with colons
                  const isBullet = line.match(/^-\s+/); // Regular bullet points
                  const isDescription = line.match(/^\*([^*]+)\*/); // Italic descriptions without dashes
                  
                  // Extract clean text for display
                  let displayText = line;
                  let className = 'response-line';
                  
                  if (isRestaurantName) {
                    // Extract the restaurant name from **bold** formatting
                    displayText = line.replace(/^\d+\.\s+\*\*([^*]+)\*\*/, '$1');
                    className += ' response-restaurant-name';
                  } else if (isDescription) {
                    // Extract the description from *italic* formatting
                    displayText = line.replace(/^-\s+\*([^*]+)\*/, '$1');
                    className += ' response-description';
                  } else if (isSubHeader) {
                    className += ' response-subheader';
                  } else if (isBullet) {
                    className += ' response-bullet';
                  } else if (line.match(/^\d+\./)) {
                    className += ' response-header';
                  } else {
                    className += ' response-text';
                  }
                  
                  return (
                    <p 
                      key={index} 
                      className={className}
                    >
                      {displayText}
                    </p>
                  );
                })}
            </div>
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
            Ask AI
          </h1>
          <p className="ai-subtitle">
            Tell us your mood or constraints. We&apos;ll suggest a spot nearby.
          </p>
        </div>

        {/* Controls section */}
        <div className={`ai-controls ${searchCollapsed ? 'ai-controls-collapsed' : ''}`}>
          {/* Header with collapse toggle */}
          <div className="controls-header">
            <h3 className="controls-title">Search Criteria</h3>
            <button
              onClick={toggleSearchCriteria}
              className="collapse-toggle"
              aria-label={searchCollapsed ? 'Expand search criteria' : 'Collapse search criteria'}
            >
              {searchCollapsed ? '🔽 Expand' : '🔼 Collapse'}
            </button>
          </div>

          {/* Collapsible content */}
          <div className={`controls-content ${searchCollapsed ? 'controls-content-collapsed' : ''}`}>
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
                  Veg-friendly
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

              {/* Wider search toggle */}
              <div className="wider-search-section">
                <label htmlFor="wider-search-ai" className="wider-search-label">
                  Wider search
                </label>
                <button
                  id="wider-search-ai"
                  onClick={() => setWiderSearch(!widerSearch)}
                  className={`wider-search-toggle ${widerSearch ? 'wider-search-toggle-active' : 'wider-search-toggle-inactive'}`}
                  aria-label="Toggle wider search (bypass database constraints)"
                  aria-pressed={widerSearch}
                >
                  <span
                    className={`wider-search-toggle-slider ${widerSearch ? 'wider-search-toggle-slider-active' : 'wider-search-toggle-slider-inactive'}`}
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
        </div>

        {/* Result panel */}
        <div className="result-panel">
          {renderResultContent()}
        </div>
      </main>
    </div>
  );
}
