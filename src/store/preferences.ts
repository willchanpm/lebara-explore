// Define the structure for dietary preferences
export type Preferences = {
  vegetarian: boolean;    // Whether the user prefers vegetarian options
  vegan: boolean;         // Whether the user prefers vegan options
  halal: boolean;         // Whether the user prefers halal options
  noPork: boolean;        // Whether the user avoids pork
  dairyFree: boolean;     // Whether the user avoids dairy products
}

// Default preferences - all set to false initially
export const DEFAULT_PREFERENCES: Preferences = {
  vegetarian: false,
  vegan: false,
  halal: false,
  noPork: false,
  dairyFree: false,
}

// Local storage key for storing preferences
const PREFERENCES_KEY = "lsx:preferences"

/**
 * Retrieves user preferences from localStorage
 * If no preferences are stored or the data is invalid, returns default preferences
 * @returns The user's preferences or default preferences if none exist
 */
export function getPreferences(): Preferences {
  try {
    // Try to get preferences from localStorage
    const stored = localStorage.getItem(PREFERENCES_KEY)
    
    // If nothing is stored, return defaults
    if (!stored) {
      return DEFAULT_PREFERENCES
    }
    
    // Try to parse the stored JSON
    const parsed = JSON.parse(stored)
    
    // Basic validation - check if it has the expected structure
    if (parsed && typeof parsed === 'object') {
      // Check if all required properties exist and are booleans
      const isValid = Object.keys(DEFAULT_PREFERENCES).every((key) => 
        key in parsed && typeof parsed[key as keyof Preferences] === 'boolean'
      )
      
      if (isValid) {
        return parsed as Preferences
      }
    }
    
    // If validation fails, return defaults
    return DEFAULT_PREFERENCES
  } catch (error) {
    // If there's any error (JSON parse error, localStorage access error, etc.)
    // return default preferences
    console.warn('Error reading preferences from localStorage:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Saves user preferences to localStorage
 * @param prefs - The preferences object to save
 */
export function setPreferences(prefs: Preferences): void {
  try {
    // Basic validation - ensure all required properties exist and are booleans
    const isValid = Object.keys(DEFAULT_PREFERENCES).every((key) => 
      key in prefs && typeof prefs[key as keyof Preferences] === 'boolean'
    )
    
    if (!isValid) {
      throw new Error('Invalid preferences format')
    }
    
    // Convert to JSON string and save to localStorage
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  } catch (error) {
    // Log error but don't throw - this prevents the app from crashing
    console.error('Error saving preferences to localStorage:', error)
  }
}

// React imports for the hook
import { useState, useEffect, useCallback } from 'react'

/**
 * React hook for managing preferences state
 * Provides a way to read and update preferences with automatic localStorage persistence
 * @returns A tuple containing [preferences, setPreferences]
 */
export function usePreferences(): [Preferences, (prefs: Preferences) => void] {
  // Initialize state with preferences from localStorage (or defaults)
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    // Use a function to initialize state to avoid calling getPreferences on every render
    return getPreferences()
  })
  
  // Function to update preferences - updates both state and localStorage
  const setPreferences = useCallback((newPrefs: Preferences) => {
    // Update the local state
    setPreferencesState(newPrefs)
    // Save to localStorage
    setPreferences(newPrefs)
  }, [])
  
  // Effect to sync with localStorage changes (useful if multiple tabs/windows are open)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY && event.newValue) {
        try {
          const newPrefs = JSON.parse(event.newValue)
          if (newPrefs && typeof newPrefs === 'object') {
            setPreferencesState(newPrefs)
          }
        } catch (error) {
          console.warn('Error parsing preferences from storage event:', error)
        }
      }
    }
    
    // Listen for storage changes (useful for cross-tab synchronization)
    window.addEventListener('storage', handleStorageChange)
    
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  return [preferences, setPreferences]
}
