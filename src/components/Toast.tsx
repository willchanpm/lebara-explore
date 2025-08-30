'use client'

import { useEffect, useState } from 'react'

// Interface for toast props
interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

// Toast component for showing user feedback
export default function Toast({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div 
      className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'} ${isAnimating ? 'toast-visible' : 'toast-hidden'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast-content">
        {/* Icon */}
        <span className="toast-icon" aria-hidden="true">
          {type === 'success' ? '✅' : '❌'}
        </span>
        
        {/* Message */}
        <span className="toast-message">{message}</span>
        
        {/* Close button */}
        <button
          onClick={() => {
            setIsAnimating(false)
            setTimeout(onClose, 300)
          }}
          className="toast-close"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
