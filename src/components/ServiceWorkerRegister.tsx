'use client'

import { useEffect } from 'react'

// Component to register the service worker for PWA functionality
// This runs on mount and registers the SW when in browser and production/localhost
export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return
    
    // Only register in production or localhost (for development testing)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (!isProduction && !isLocalhost) {
      console.log('Service Worker not registered: not in production or localhost')
      return
    }

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      console.log('Registering Service Worker...')
      
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
          
          // Listen for updates but don't force them
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New Service Worker available - will activate on next page load')
                  // Don't force activation - let it happen naturally
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    } else {
      console.log('Service Workers not supported in this browser')
    }
  }, []) // Empty dependency array means this runs once on mount

  // This component doesn't render anything visible
  return null
}
