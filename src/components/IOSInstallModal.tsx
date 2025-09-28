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
    <div 
      className={`modal fade ${isOpen ? 'show' : ''}`}
      style={{ 
        display: isOpen ? 'block' : 'none',
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-modal-title"
      aria-describedby="ios-install-modal-description"
    >
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show"
        style={{ 
          zIndex: 99998,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh'
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        style={{ zIndex: 99999 }}
      >
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h2 id="ios-install-modal-title" className="modal-title h5 fw-bold">
              Install on iPhone/iPad
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="btn-close"
              aria-label="Close installation guide"
            ></button>
          </div>

          {/* Content */}
          <div className="modal-body">
            <p id="ios-install-modal-description" className="text-muted mb-4">
              Follow these steps to add Lebara Explore to your home screen:
            </p>
            
            {/* Step-by-step instructions */}
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex gap-3">
                <div 
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
                >
                  1
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">Tap the Share button</h6>
                  <p className="text-muted mb-0 small">Look for the Share button (📤) in your Safari browser toolbar</p>
                </div>
              </div>
              
              <div className="d-flex gap-3">
                <div 
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
                >
                  2
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">Scroll down and tap &ldquo;Add to Home Screen&rdquo;</h6>
                  <p className="text-muted mb-0 small">You&apos;ll see this option in the Share menu</p>
                </div>
              </div>
              
              <div className="d-flex gap-3">
                <div 
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
                >
                  3
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">Customize the name (optional)</h6>
                  <p className="text-muted mb-0 small">You can change the app name or keep &ldquo;Lebara Explore&rdquo;</p>
                </div>
              </div>
              
              <div className="d-flex gap-3">
                <div 
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
                >
                  4
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">Tap &ldquo;Add&rdquo;</h6>
                  <p className="text-muted mb-0 small">The app will appear on your home screen like a native app</p>
                </div>
              </div>
            </div>
            
            {/* Pro tip */}
            <div className="alert alert-info d-flex gap-3">
              <div className="flex-shrink-0" style={{ fontSize: '1.25rem' }}>💡</div>
              <div>
                <h6 className="alert-heading mb-1">Pro Tip</h6>
                <p className="mb-0 small">Once installed, you can access Lebara Explore directly from your home screen, just like any other app!</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
