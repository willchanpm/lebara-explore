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
                className="btn btn-sm px-3 py-2 text-white"
                style={{ 
                  backgroundColor: '#ff5aa7',
                  borderColor: '#ff5aa7'
                }}
                aria-label="View installation guide"
              >
                <i className="bi bi-download me-1"></i>
                Install
              </button>
            </div>
          </div>
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
