'use client'

import { useEffect } from 'react'

// Modal component that explains how to install PWA on iOS
export default function IOSInstallModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      // Add class to hide profile elements
      document.body.classList.add('modal-open')
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset'
      // Remove class to show profile elements
      document.body.classList.remove('modal-open')
    }
  }, [isOpen, onClose])

  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="ios-install-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="ios-install-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-modal-title"
        aria-describedby="ios-install-modal-description"
      >
        {/* Header */}
        <div className="ios-install-modal-header">
          <h2 id="ios-install-modal-title" className="ios-install-modal-title">
            Install on iPhone/iPad
          </h2>
          <button
            onClick={onClose}
            className="ios-install-modal-close"
            aria-label="Close installation guide"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="ios-install-modal-content">
          <p id="ios-install-modal-description" className="ios-install-modal-description">
            Follow these steps to add Lebara Explore to your home screen:
          </p>
          
          {/* Step-by-step instructions */}
          <div className="ios-install-steps">
            <div className="ios-install-step">
              <div className="ios-install-step-number">1</div>
              <div className="ios-install-step-content">
                <h3>Tap the Share button</h3>
                <p>Look for the Share button (📤) in your Safari browser toolbar</p>
              </div>
            </div>
            
            <div className="ios-install-step">
              <div className="ios-install-step-number">2</div>
              <div className="ios-install-step-content">
                <h3>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</h3>
                <p>You&apos;ll see this option in the Share menu</p>
              </div>
            </div>
            
            <div className="ios-install-step">
              <div className="ios-install-step-number">3</div>
              <div className="ios-install-step-content">
                <h3>Customize the name (optional)</h3>
                <p>You can change the app name or keep &ldquo;Lebara Explore&rdquo;</p>
              </div>
            </div>
            
            <div className="ios-install-step">
              <div className="ios-install-step-number">4</div>
              <div className="ios-install-step-content">
                <h3>Tap &ldquo;Add&rdquo;</h3>
                <p>The app will appear on your home screen like a native app</p>
              </div>
            </div>
          </div>
          
          {/* Pro tip */}
          <div className="ios-install-pro-tip">
            <div className="ios-install-pro-tip-icon">💡</div>
            <div className="ios-install-pro-tip-content">
              <h4>Pro Tip</h4>
              <p>Once installed, you can access Lebara Explore directly from your home screen, just like any other app!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ios-install-modal-footer">
          <button
            onClick={onClose}
            className="ios-install-modal-btn ios-install-modal-btn-primary"
          >
            Got it!
          </button>
        </div>
      </div>
    </>
  )
}
