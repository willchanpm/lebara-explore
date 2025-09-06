'use client'

import { useEffect } from 'react'
import Image from 'next/image'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageAlt: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, imageAlt }: ImageModalProps) {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null
  }

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button 
          className="image-modal-close" 
          onClick={onClose}
          aria-label="Close image modal"
        >
          ×
        </button>
        
        {/* Full-size image */}
        <Image 
          src={imageUrl} 
          alt={imageAlt}
          className="image-modal-image"
          width={800}
          height={600}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  )
}
