'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import IOSInstallModal from './IOSInstallModal'

// Component to show iOS PWA install banner on homepage only
// iOS doesn't have beforeinstallprompt event, so we guide users through manual process
export default function IOSInstallBanner() {
  // State to control visibility
  const [showBanner, setShowBanner] = useState(false)
  // State to track if user has dismissed the banner
  const [dismissed, setDismissed] = useState(false)
  // State to track if app is installed
  const [isInstalled, setIsInstalled] = useState(false)
  // State to control modal visibility
  const [showModal, setShowModal] = useState(false)
  
  // Get current pathname to only show on homepage
  const pathname = usePathname()



  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return

    // Only show on homepage
    if (pathname !== '/') return



    // Check if this is iOS Safari (we only show install banner on iOS Safari)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    if (!isIOS || !isSafari) {
      return
    }

    // Check if app is already installed (standalone mode)
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
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

    // Show banner immediately for eligible iOS users
    setShowBanner(true)
  }, [pathname])

  // Handle dismiss button click (X button)
  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    
    // Set 7-day cooldown in localStorage
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa_install_dismissed_until', sevenDaysFromNow.toString())
  }

  // Handle install button click (shows modal)
  const handleInstallClick = () => {
    setShowModal(true)
  }

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false)
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

  // Don't render if not showing
  if (!showBanner) {
    return null
  }
  


  return (
    <div 
      role="region" 
      aria-label="Install app banner for iOS"
      className="ios-install-banner"
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
          {/* Guide button */}
          <button
            onClick={handleInstallClick}
            className="install-banner-btn install-banner-btn-primary"
            aria-label="View installation guide"
          >
            Install
          </button>
        </div>
      </div>
      
      {/* Installation guide modal */}
      <IOSInstallModal 
        isOpen={showModal}
        onClose={handleModalClose}
      />
    </div>
  )
}
