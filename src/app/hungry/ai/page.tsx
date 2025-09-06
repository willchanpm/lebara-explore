// JSON-AI CHECK: PASS (2024-12-19)
'use client';

import { useState } from 'react';

// Define the structure for the AI response
type PriceBand = '£' | '££' | '£££' | '££££' | string;
type AISource = 'db' | 'model';

interface AISuggestion {
  id?: string;              // present for DB results
  name: string;
  category?: string;        // cuisine/category
  price_band?: PriceBand;
  veg_friendly?: boolean;
  description?: string;
  url?: string;             // website
  maps_url?: string;        // google maps link
  source: AISource;
}

interface AIResponseJSON {
  suggestions: AISuggestion[];   // ordered list of suggestions
  trace?: string;                // optional model trace or explanation
}

// Define the structure for the result state
interface AIResult {
  data: AIResponseJSON | null;
  loading: boolean;
  error: string | null;
}

export default function AskAIPage() {
  // State for all the form controls - updated variable names to match requirements
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]); // Selected mood chips
  const [textQuery, setTextQuery] = useState(''); // User's text input (renamed from userInput)
  const [allowedPrices, setAllowedPrices] = useState<string[]>([]); // Selected price ranges (renamed from selectedPrices)
  const [vegFriendly, setVegFriendly] = useState(false); // Vegetarian toggle
  const [widerSearch, setWiderSearch] = useState(false); // Wider search toggle
  const [collapsed, setCollapsed] = useState(false); // Search criteria collapsed state (renamed from searchCollapsed)
  
  // State for the AI result
  const [result, setResult] = useState<AIResult>({
    data: null,
    loading: false,
    error: null
  });

  // Mood options for quick selection - updated to match requirements
  const MOODS = [
    { key: 'quick', label: 'Quick', emoji: '⚡' },
    { key: 'cozy', label: 'Cozy', emoji: '🕯️' },
    { key: 'cheap', label: 'Cheap', emoji: '💰' },
    { key: 'close', label: 'Close', emoji: '📍' },
    { key: 'impress', label: 'Impress', emoji: '✨' },
    { key: 'outdoor', label: 'Outdoor', emoji: '🌳' }
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
    setAllowedPrices(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price) // Remove if already selected
        : [...prev, price] // Add if not selected
    );
  };

  // Function to clear all criteria
  const clearAllCriteria = () => {
    setSelectedMoods([]);
    setTextQuery('');
    setAllowedPrices([]);
    setVegFriendly(false);
    setWiderSearch(false);
  };

  // Function to toggle collapse state
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };



  // Function to handle the suggest action
  const handleSuggest = async () => {
    // Validate that we have some input
    if (!textQuery && selectedMoods.length === 0) {
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
    setCollapsed(true);
    
    try {
      // Prepare the request payload
      const requestBody = {
        quickMood: selectedMoods,
        notes: textQuery,
        priceBand: allowedPrices.length > 0 ? allowedPrices[0] : undefined,
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

      const data: AIResponseJSON = await response.json();
      
      // FIXED(JSON-AI): Add dev logging and legacy format detection
      const __DEV__ = process.env.NODE_ENV !== 'production';
      if (__DEV__ && data && 'result' in data) {
        console.warn('[AI JSON] API returned legacy {result}. Update backend to {suggestions:[...]}.', data);
      }
      if (__DEV__) {
        console.table(data?.suggestions ?? []);
      }
      
      // Validate response has suggestions
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('AI returned an unexpected format.');
      }
      
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
  const onSuggest = () => {
    // Re-run the suggest logic with the same inputs
    handleSuggest();
  };

  // Function to handle re-roll (get new suggestions with same prompt)
  const handleReroll = () => {
    // Re-run the suggest logic with the same inputs
    handleSuggest();
  };


  // Get the AI suggestions for rendering
  const suggestions = result.data?.suggestions || [];
  const loading = result.loading;
  const error = result.error;

  // Utility variables for summary display
  const activeMoods = MOODS.filter(m => selectedMoods.includes(m.key));
  const activePrices = ['£','££','£££'].filter(p => allowedPrices.includes(p));
  const hasAny = activeMoods.length > 0 || activePrices.length > 0 || vegFriendly || widerSearch || (textQuery?.trim().length > 0);

  return (
    <div className="container py-4 pb-5">
      {/* Hero section */}
      <h1 className="display-5 fw-bold text-center mb-2">Ask AI</h1>
      <p className="lead text-center text-muted mb-4">Tell us your mood or constraints. We'll suggest a spot nearby.</p>

      {/* Search Criteria card (collapsible) */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Search Criteria</h5>
            <button
              type="button"
              className="btn btn-sm btn-ghost rounded-pill px-2 py-1 d-flex align-items-center gap-1"
              onClick={toggleCollapse}
              aria-expanded={!collapsed}
              aria-controls="criteria-body"
            >
              {collapsed ? <>⬇ <span>Expand</span></> : <>⬆ <span>Collapse</span></>}
            </button>
          </div>
          
          {/* Summary row - only shown when collapsed and has selections */}
          {!collapsed && null}
          {collapsed && hasAny && (
            <div className="mt-2">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {/* Free text */}
                {textQuery?.trim() && (
                  <span className="badge rounded-pill bg-light text-dark small">"{textQuery.trim()}"</span>
                )}

                {/* Moods */}
                {activeMoods.map(m => (
                  <span key={m.key} className="badge rounded-pill bg-light text-dark small">
                    <span className="me-1">{m.emoji}</span>{m.label}
                  </span>
                ))}

                {/* Price */}
                {activePrices.length > 0 && (
                  <span className="badge rounded-pill bg-light text-dark small">
                    Price: {activePrices.join(' / ')}
                  </span>
                )}

                {/* Veg */}
                {vegFriendly && (
                  <span className="badge rounded-pill bg-light text-dark small">🌱 Veg-friendly</span>
                )}

                {/* Wider search */}
                {widerSearch && (
                  <span className="badge rounded-pill bg-light text-dark small">🌍 Include outside list</span>
                )}

                {/* Spacer + Clear */}
                <span className="flex-grow-1"></span>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none text-muted ms-auto"
                  onClick={(e) => {
                    clearAllCriteria();
                    e.currentTarget.blur();
                  }}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  onMouseLeave={(e) => e.currentTarget.blur()}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
          
          <hr className="text-body-tertiary my-2" />
          {/* criteria body is hidden when collapsed */}
          {!collapsed && (
            <div id="criteria-body">
              {/* Quick Mood chips */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Quick Mood</h5>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost rounded-pill px-2 py-1 d-flex align-items-center gap-1"
                  onClick={clearAllCriteria}
                >
                  🗑️ <span>Clear</span>
                </button>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {MOODS.map(m => {
                  const active = selectedMoods.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      className={`btn btn-sm rounded-pill shadow-sm ${active ? 'text-white border-0' : 'text-dark border'}`}
                      style={{ 
                        width: 'auto',
                        ...(active ? { backgroundColor: 'rgba(255, 49, 130, 0.85)' } : { backgroundColor: '#fff' }) 
                      }}
                      onClick={() => toggleMood(m.key)}
                      aria-pressed={active}
                    >
                      <span className="me-1">{m.emoji}</span>{m.label}
                    </button>
                  );
                })}
              </div>

              {/* Tell us more */}
              <div className="mb-3">
                <h5 className="fw-bold mb-3">Tell us more</h5>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. craving noodles, 10-minute walk, under £15"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                />
                <div className="form-text">Add any constraints or vibes you like.</div>
              </div>

              {/* Optional constraints */}
              <div className="mb-3">
                <h5 className="fw-bold mb-3">Optional Constraints</h5>

                {/* Price range pills (fixed size, centered) */}
                <h5 className="fw-bold mb-3">Price Range</h5>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {['£','££','£££'].map(p => {
                    const active = allowedPrices.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-sm rounded-pill d-inline-flex align-items-center justify-content-center ${active ? 'text-white border-0' : 'text-dark border'} shadow-sm`}
                        style={{ width: 56, height: 32, ...(active ? { backgroundColor: 'rgba(255, 49, 130, 0.85)' } : { backgroundColor: '#fff' }) }}
                        onClick={() => togglePrice(p)}
                        aria-pressed={active}
                      >{p}</button>
                    );
                  })}
                </div>

                {/* Switches on right */}
                <div className="d-flex align-items-center justify-content-between my-2">
                  <span className="text-muted">🌱 Veg-friendly</span>
                  <div className="form-check form-switch m-0">
                    <input className="form-check-input switch-lg" type="checkbox" id="vegSwitch" checked={vegFriendly} onChange={e=>setVegFriendly(e.target.checked)} />
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between my-2">
                  <span className="text-muted">Include places outside our list*</span>
                  <div className="form-check form-switch m-0">
                    <input className="form-check-input switch-lg" type="checkbox" id="widerSwitch" checked={widerSearch} onChange={e=>setWiderSearch(e.target.checked)} />
                  </div>
                </div>
                {widerSearch && (
                  <div className="form-text text-muted small">
                    *This will use AI to search outside our list
                  </div>
                )}

              </div>

              {/* Suggest CTA */}
              <button
                type="button"
                className="btn text-white fw-semibold w-100 py-3 rounded-4 mt-3"
                style={{ backgroundColor: 'rgba(255, 49, 130, 0.85)' }}
                onClick={onSuggest}
                disabled={loading}
                data-testid="ai-suggest"
              >
                🤖 {loading ? 'Thinking…' : 'Suggest'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results section */}
      <div className="card border-0 shadow-sm rounded-4 mb-5">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">AI Suggestions</h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1"
              onClick={onSuggest}
              disabled={loading}
            >
              🎲 Re-roll
            </button>
          </div>
          <hr className="text-body-tertiary my-2" />
          {/* AI Suggestions Cards */}
          {loading && (
            <div className="text-center text-muted py-4">
              <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
              Finding suggestions...
            </div>
          )}
          {error && <div className="alert alert-warning mt-3 mb-0">{error}</div>}
          {!loading && !error && suggestions.length === 0 && (
            <p className="text-muted mb-0">No suggestions yet — set some criteria and tap Suggest.</p>
          )}
          {!loading && !error && suggestions.length > 0 && (
            <div>
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.id || index} className="card border-0 shadow-sm rounded-4 mb-3">
                  <div className="card-body p-4">
                    {/* Title */}
                    <h6 className="fw-bold mb-2">{suggestion.name}</h6>
                    
                    {/* Subtitle row */}
                    <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                      {suggestion.category && (
                        <span className="badge bg-light text-dark small">{suggestion.category}</span>
                      )}
                      {suggestion.price_band && (
                        <span className="badge bg-light text-dark small rounded-pill">{suggestion.price_band}</span>
                      )}
                      {suggestion.veg_friendly && (
                        <span className="badge bg-light text-dark small rounded-pill">🌱 Veg-friendly</span>
                      )}
                    </div>
                    
                    {/* Description */}
                    {suggestion.description && (
                      <p className="text-muted small mb-3" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {suggestion.description}
                      </p>
                    )}
                    
                    {/* Footer actions */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex gap-2">
                        {suggestion.maps_url && (
                          <a 
                            href={suggestion.maps_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                          >
                            🗺️ Maps
                          </a>
                        )}
                        {suggestion.url && (
                          <a 
                            href={suggestion.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                      <small className="text-muted">
                        From: {suggestion.source === 'db' ? 'Our list' : 'AI'}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
