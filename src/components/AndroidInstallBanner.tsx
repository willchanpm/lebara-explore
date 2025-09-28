'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

// Interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Component to show Android PWA install banner on homepage only
// Only renders on Android Chrome when the app is installable
export default function AndroidInstallBanner() {
  // State to store the deferred prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // State to control visibility
  const [showBanner, setShowBanner] = useState(false)
  // State to track if user has dismissed the banner
  const [dismissed, setDismissed] = useState(false)
  // State to track if app is installed
  const [isInstalled, setIsInstalled] = useState(false)
  
  // Get current pathname to only show on homepage
  const pathname = usePathname()

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return

    // Only show on homepage
    if (pathname !== '/') return

    // Check if this is Android Chrome (we only show install banner on Android Chrome)
    const isAndroidChrome = /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent)
    

    
    if (!isAndroidChrome) {
      return
    }

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Check if user has already installed the app
    const pwaInstalled = localStorage.getItem('pwa_installed')
    if (pwaInstalled === '1') {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the banner recently (7 days)
    const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until')
    if (dismissedUntil) {
      const dismissedTimestamp = parseInt(dismissedUntil)
      if (Date.now() < dismissedTimestamp) {
        setDismissed(true)
        return
      } else {
        // Clear expired dismissal
        localStorage.removeItem('pwa_install_dismissed_until')
      }
    }

    // Show banner immediately for eligible users, then wait for install prompt
    setShowBanner(true)

    // Set a timeout to enable install button even if event hasn't fired yet
    // This prevents the banner from being stuck in "Loading..." state too long
    const enableInstallTimeout = setTimeout(() => {
      // Create a mock prompt event to enable the button
      // This allows users to click install even if the real event is delayed
      const mockPrompt = {
        prompt: async () => {
          // If the real event fires later, use that instead
          return { outcome: 'dismissed' as const }
        },
        userChoice: Promise.resolve({ outcome: 'dismissed' as const })
      } as BeforeInstallPromptEvent
      setDeferredPrompt(mockPrompt)
    }, 1000) // Enable after 1 second

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault()
      
      // Store the event so we can trigger it later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
      setIsInstalled(true)
      // Mark as installed in localStorage
      localStorage.setItem('pwa_installed', '1')
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(enableInstallTimeout)
    }
  }, [pathname])

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
      setShowBanner(false)
      
      // If user accepted, we don't need to show the prompt again
      if (outcome === 'accepted') {
        setIsInstalled(true)
        localStorage.setItem('pwa_installed', '1')
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
      // Hide banner if there's an error
      setShowBanner(false)
    }
  }

  // Handle dismiss button click (Not now or X button)
  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    
    // Set 7-day cooldown in localStorage
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa_install_dismissed_until', sevenDaysFromNow.toString())
  }

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showBanner) {
        handleDismiss()
      }
    }

    if (showBanner) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showBanner])

  // Don't render if dismissed, installed, or not on homepage
  if (dismissed || isInstalled || pathname !== '/') {
    return null
  }

  // Don't render if we don't have the install prompt yet (banner will show but install button disabled)
  if (!showBanner) {
    return null
  }

  return (
    <div 
      role="region" 
      aria-label="Install app banner"
      className="position-sticky top-0 mb-3 mx-2"
      style={{ zIndex: 10 }}
      aria-live="polite"
    >
      {/* Bootstrap card with custom pink styling */}
      <div 
        className="card border-0 shadow-sm rounded-xl"
        style={{ 
          background: 'linear-gradient(135deg, #ffe7f1 0%, #ffc1d7 100%)',
          border: '1px solid #ffc1d7'
        }}
      >
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3">
            {/* Close X button */}
            <button
              onClick={handleDismiss}
              className="btn btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ 
                width: '32px', 
                height: '32px',
                background: 'rgba(255, 90, 167, 0.1)',
                borderColor: 'rgba(255, 90, 167, 0.2)',
                color: '#ff5aa7',
                transition: 'all 0.2s ease'
              }}
              aria-label="Close install banner"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 90, 167, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(255, 90, 167, 0.4)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 90, 167, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 90, 167, 0.2)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: '1rem', fontWeight: 'bold' }}></i>
            </button>

            {/* App icon */}
            <div className="position-relative flex-shrink-0">
              <Image
                src="/AppIcons/Assets.xcassets/AppIcon.appiconset/192.png"
                alt="Lebara Explore app icon"
                width={48}
                height={48}
                className="rounded"
                onError={(e) => {
                  // Fallback to initials if image fails
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              {/* Fallback initials if image fails */}
              <div 
                className="bg-primary text-white rounded d-none align-items-center justify-content-center fw-bold"
                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
              >
                LE
              </div>
            </div>

            {/* Text content */}
            <div className="flex-grow-1 text-center">
              <h5 className="fw-bold mb-0 text-dark">Install app</h5>
            </div>

            {/* Install button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className={`btn btn-sm px-3 py-2 ${
                  deferredPrompt 
                    ? 'text-white' 
                    : 'btn-outline-secondary'
                }`}
                style={deferredPrompt ? { 
                  backgroundColor: '#ff5aa7',
                  borderColor: '#ff5aa7'
                } : {}}
                aria-label={deferredPrompt ? "Install app" : "Waiting for install prompt"}
              >
                {deferredPrompt ? (
                  <>
                    <i className="bi bi-download me-1"></i>
                    Install
                  </>
                ) : (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Preparing...
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
