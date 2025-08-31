'use client'

import { useEffect, useState } from 'react'

// Interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Component to show Android PWA install prompt
// Only renders on Android Chrome when the app is installable
export default function PWAInstallPrompt() {
  // State to store the deferred prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // State to control visibility
  const [showPrompt, setShowPrompt] = useState(false)
  // State to track if user has dismissed the prompt
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return

    // Check if this is iOS (we don't show install prompt on iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) return

    // Check if user has dismissed the prompt recently (7 days)
    const dismissedTimestamp = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTimestamp) {
      const dismissedDate = new Date(dismissedTimestamp)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (dismissedDate > sevenDaysAgo) {
        setDismissed(true)
        return
      } else {
        // Clear expired dismissal
        localStorage.removeItem('pwa-install-dismissed')
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA install prompt available')
      
      // Prevent the default mini-infobar from appearing
      e.preventDefault()
      
      // Store the event so we can trigger it later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Handle install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`User response to the install prompt: ${outcome}`)
      
      // Clear the deferred prompt
      setDeferredPrompt(null)
      setShowPrompt(false)
      
      // If user accepted, we don't need to show the prompt again
      if (outcome === 'accepted') {
        setDismissed(true)
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  // Handle dismiss button click
  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    
    // Store dismissal timestamp in localStorage for 7 days
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  // Don't render if not showing or if dismissed
  if (!showPrompt || dismissed) return null

  return (
    <div className="pwa-install-banner">
      {/* Install button */}
      <button
        onClick={handleInstallClick}
        className="pwa-install-btn"
        aria-label="Install Lebara Explore app"
        title="Install Lebara Explore app"
      >
        📱 Install app
      </button>
      
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="pwa-dismiss-btn"
        aria-label="Dismiss install prompt"
        title="Dismiss install prompt"
      >
        ✕
      </button>
    </div>
  )
}
