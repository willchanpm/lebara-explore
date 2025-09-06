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
    <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{backgroundColor: 'rgba(0,0,0,0.9)'}}></div>
      <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content bg-transparent border-0">
          <div className="modal-header border-0 justify-content-end">
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close image modal"
            ></button>
          </div>
          <div className="modal-body text-center p-0">
            {/* Full-size image */}
            <Image 
              src={imageUrl} 
              alt={imageAlt}
              className="img-fluid rounded-3"
              width={800}
              height={600}
              style={{ maxHeight: '80vh', width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
