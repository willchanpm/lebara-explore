'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    if (isVisible && duration > 0) {
      // Auto-hide after duration
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div 
      className={`toast toast-visible ${type === 'success' ? 'toast-success' : 'toast-error'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: '6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 20px rgba(10, 42, 74, 0.15)',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        maxWidth: '24rem',
        width: 'calc(100% - 2rem)',
        display: 'block'
      }}
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
          onClick={onClose}
          className="toast-close"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}
