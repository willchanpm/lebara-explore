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
    
    // Debug logging
    console.log('Android Banner Debug:', {
      userAgent: navigator.userAgent,
      isAndroidChrome,
      pathname,
      showBanner: true
    })
    
    if (!isAndroidChrome) {
      console.log('Android Banner: Not showing - platform check failed')
      return
    }

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (navigator as Navigator & { standalone?: boolean }).standalone === true
    console.log('Android Banner: Standalone check:', { isStandalone })
    if (isStandalone) {
      console.log('Android Banner: Not showing - app already installed (standalone)')
      setIsInstalled(true)
      return
    }

    // Check if user has already installed the app
    const pwaInstalled = localStorage.getItem('pwa_installed')
    console.log('Android Banner: PWA installed check:', { pwaInstalled })
    if (pwaInstalled === '1') {
      console.log('Android Banner: Not showing - PWA already installed')
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the banner recently (7 days)
    const dismissedUntil = localStorage.getItem('pwa_install_dismissed_until')
    console.log('Android Banner: Dismissed check:', { dismissedUntil })
    if (dismissedUntil) {
      const dismissedTimestamp = parseInt(dismissedUntil)
      if (Date.now() < dismissedTimestamp) {
        console.log('Android Banner: Not showing - user dismissed recently')
        setDismissed(true)
        return
      } else {
        // Clear expired dismissal
        localStorage.removeItem('pwa_install_dismissed_until')
        console.log('Android Banner: Cleared expired dismissal')
      }
    }

    // Show banner immediately for eligible users, then wait for install prompt
    setShowBanner(true)

    // Set a timeout to enable install button even if event hasn't fired yet
    // This prevents the banner from being stuck in "Loading..." state too long
    const enableInstallTimeout = setTimeout(() => {
      console.log('Enabling install button after timeout')
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
      console.log('PWA install prompt available')
      
      // Prevent the default mini-infobar from appearing
      e.preventDefault()
      
      // Store the event so we can trigger it later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('PWA was installed')
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
    console.log('Android Banner: Not rendering - conditions not met:', { dismissed, isInstalled, pathname })
    return null
  }

  // Don't render if we don't have the install prompt yet (banner will show but install button disabled)
  if (!showBanner) {
    console.log('Android Banner: Not rendering - showBanner is false')
    return null
  }
  
  console.log('Android Banner: Rendering component')

  return (
    <div 
      role="region" 
      aria-label="Install app banner"
      className="android-install-banner"
      aria-live="polite"
    >
      {/* Card container with Lebara-inspired design */}
      <div className="install-banner-card">
        {/* Close X button on the far left */}
        <button
          onClick={handleDismiss}
          className="install-banner-close-left"
          aria-label="Close install banner"
        >
          ✕
        </button>

        {/* Left icon section */}
        <div className="install-banner-icon">
          <Image
            src="/AppIcons/Assets.xcassets/AppIcon.appiconset/192.png"
            alt="Lebara Explore app icon"
            width={48}
            height={48}
            className="app-icon"
            onError={(e) => {
              // Fallback to initials if image fails
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          {/* Fallback initials if image fails */}
          <div className="app-icon-fallback">LE</div>
        </div>

        {/* Text content section */}
        <div className="install-banner-content">
          <h3 className="install-banner-title">Install app</h3>
        </div>

        {/* Actions section */}
        <div className="install-banner-actions">
          {/* Install button */}
          <button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className={`install-banner-btn install-banner-btn-primary ${!deferredPrompt ? 'install-banner-btn-disabled' : ''}`}
            aria-label={deferredPrompt ? "Install app" : "Waiting for install prompt"}
          >
            {deferredPrompt ? 'Install' : 'Preparing...'}
          </button>
        </div>
      </div>
    </div>
  )
}
