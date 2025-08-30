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

  const baseClasses = "fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform"
  const typeClasses = type === 'success' 
    ? "bg-green-500 text-white" 
    : "bg-red-500 text-white"
  const animationClasses = isAnimating 
    ? "translate-x-0 opacity-100" 
    : "translate-x-full opacity-0"

  return (
    <div className={`${baseClasses} ${typeClasses} ${animationClasses}`}>
      <div className="flex items-center gap-2">
        {/* Icon */}
        <span className="text-lg">
          {type === 'success' ? '✅' : '❌'}
        </span>
        
        {/* Message */}
        <span className="font-medium">{message}</span>
        
        {/* Close button */}
        <button
          onClick={() => {
            setIsAnimating(false)
            setTimeout(onClose, 300)
          }}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}
