'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { saveCheckIn, getCurrentUserId } from '@/lib/saveCheckIn'
import Toast from './Toast'

// Interface for the modal props
interface BingoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: BingoCompletionData) => void
  tileLabel: string
  tileId: string
  boardMonth: string
}

// Interface for the completion data
interface BingoCompletionData {
  image: string | null
  rating: number
  comment: string
  photoUrl?: string | null
}

// Interface for the star rating component
interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
}

// Star Rating Component
// This component displays 5 stars that users can click to rate their experience
function StarRating({ rating, onRatingChange }: StarRatingProps) {
  return (
    <div className="star-rating d-flex gap-2">
      {/* Display 5 stars, each can be clicked to set the rating */}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`btn btn-link p-0 text-decoration-none ${star <= rating ? 'text-warning' : 'text-muted'}`}
          onClick={() => onRatingChange(star)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          style={{ fontSize: '2rem', lineHeight: '1' }}
        >
          {/* Star icon - filled or empty based on rating */}
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

// Main Modal Component
export default function BingoModal({ 
  isOpen, 
  onClose, 
  onSave, 
  tileLabel, 
  tileId, 
  boardMonth 
}: BingoModalProps) {
  // State variables to store the form data
  const [image, setImage] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // File state for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })
  
  // References to file input and camera elements
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // State to control camera mode
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  // Refs for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const firstInputRef = useRef<HTMLButtonElement>(null)

  // Handle body scroll and focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Prevent background scroll
      document.body.classList.add('modal-open')
      
      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    } else {
      // Restore background scroll
      document.body.classList.remove('modal-open')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isOpen, stream])

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  // Function to handle file selection from device
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Store the actual file for upload
      setSelectedFile(file)
      
      // Convert the selected file to a data URL for display
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Function to start camera for taking photos
  const startCamera = async () => {
    try {
      // Request access to the user's camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      
      setStream(mediaStream)
      setShowCamera(true)
      
      // Wait for React to render the video element before setting srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          
          // Add event listeners for video loading
          videoRef.current.onloadedmetadata = () => {
            // Video metadata loaded
          }
          
          videoRef.current.oncanplay = () => {
            // Video can play
          }
          
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e)
          }
        } else {
          console.error('Video ref is null after timeout')
        }
      }, 100) // Small delay to ensure video element is rendered
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      showToast('Unable to access camera. Please try uploading an image instead.', 'error')
    }
  }

  // Function to stop camera and clean up
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  // Function to capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        
        // Draw the current video frame to canvas
        context.drawImage(videoRef.current, 0, 0)
        
        // Convert canvas to blob and create file
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setSelectedFile(file)
          }
        }, 'image/jpeg')
        
        // Convert canvas to data URL and set as image
        const photoDataUrl = canvasRef.current.toDataURL('image/jpeg')
        setImage(photoDataUrl)
        
        // Stop camera after capturing
        stopCamera()
      }
    }
  }

  // Function to remove the current image
  const removeImage = () => {
    setImage(null)
    setSelectedFile(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Function to show toast notifications
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }

  // Function to handle form submission
  const handleSave = async () => {
    if (rating === 0) {
      showToast('Please select a rating before saving.', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      // Get current user ID
      const userId = await getCurrentUserId(supabase)
      
      // Start timing for telemetry
      const startTime = Date.now()
      
      // Save check-in to Supabase
      const { data, error } = await saveCheckIn({
        supabase,
        userId,
        tileId,
        boardMonth,
        comment,
        rating,
        file: selectedFile
      })
      
      if (error) {
        showToast(error, 'error')
        return
      }
      
      // Calculate elapsed time for telemetry
      const elapsedMs = Date.now() - startTime
      
      // Log telemetry
      console.info({
        tileId,
        boardMonth,
        hasPhoto: !!selectedFile,
        rating,
        elapsedMs
      })
      
      // Show success toast
      showToast('Saved!', 'success')
      
      // Call the onSave function with the completion data
      await onSave({
        image,
        rating,
        comment,
        photoUrl: data?.photo_url || null
      })
      
      // Reset form and close modal
      setImage(null)
      setRating(0)
      setComment('')
      setSelectedFile(null)
      setIsLoading(false)
      onClose()
      
    } catch (error) {
      console.error('Error saving bingo completion:', error)
      
      if (error instanceof Error && error.message === 'User not authenticated') {
        showToast('Please sign in to save your progress.', 'error')
      } else {
        showToast('Error saving. Please try again.', 'error')
      }
      
      setIsLoading(false)
    }
  }

  // Function to handle modal close
  const handleClose = () => {
    // Stop camera if it's running
    if (showCamera) {
      stopCamera()
    }
    
    // Reset form
    setImage(null)
    setRating(0)
    setComment('')
    setSelectedFile(null)
    
    onClose()
  }

  // Don't render anything if modal is not open
  if (!isOpen) return null

  const modalContent = (
    <>
      <div 
        className="modal fade show d-block" 
        role="dialog" 
        aria-modal="true"
        style={{ backgroundColor: 'rgba(0,0,0,.5)' }}
      >
        <div className="modal-dialog modal-dialog-centered modal-md modal-lg modal-xl">
          <div className="modal-content rounded-4 shadow-lg" style={{ maxHeight: '90vh', overflow: 'auto' }}>
            {/* Modal Header */}
            <div className="modal-header border-0 px-4 py-3 px-sm-4 py-sm-4">
              <h4 className="modal-title fw-bold mb-0" id="bingo-modal-title">
                Complete: {tileLabel}
              </h4>
              <button 
                ref={closeButtonRef}
                type="button" 
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
              />
            </div>

            {/* Modal Body */}
            <div className="modal-body px-4 py-3 px-sm-4 py-sm-4">
              <div className="d-flex flex-column gap-3 gap-sm-4">
                {/* Photo Section */}
                <div>
                  <h6 className="text-muted small fw-medium mb-3">Add a Photo</h6>
                  
                  <div className="card border-0 bg-body-tertiary rounded-4 p-4">
                    {!image && !showCamera && (
                      <div className="d-flex flex-column flex-sm-row gap-3">
                        {/* Upload from device button */}
                        <button
                          ref={firstInputRef}
                          type="button"
                          className="btn btn-outline-secondary rounded-pill px-4 py-2"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ minHeight: '44px' }}
                        >
                          📁 Upload Photo
                        </button>
                        
                        {/* Take photo button */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary rounded-pill px-4 py-2"
                          onClick={startCamera}
                          style={{ minHeight: '44px' }}
                        >
                          📷 Take Photo
                        </button>
                        
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </div>
                    )}

                    {/* Camera view */}
                    {showCamera && (
                      <div>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="camera-video w-100 rounded-3"
                          style={{ height: '240px', objectFit: 'cover' }}
                          onError={(e) => console.error('Video element error:', e)}
                        />
                        <div className="d-flex flex-column flex-sm-row gap-3 mt-3">
                          <button
                            type="button"
                            className="btn btn-primary rounded-pill px-4 py-2"
                            onClick={capturePhoto}
                            style={{ minHeight: '44px' }}
                          >
                            📸 Capture
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill px-4 py-2"
                            onClick={stopCamera}
                            style={{ minHeight: '44px' }}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                    )}

                    {/* Display captured/uploaded image */}
                    {image && (
                      <div className="text-center">
                        <div className="card border-0 bg-white rounded-4 p-3 mb-3 d-inline-block">
                          <Image 
                            src={image} 
                            alt="Bingo completion" 
                            className="image-preview rounded-3" 
                            width={140} 
                            height={140}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-danger rounded-pill px-4 py-2"
                          onClick={removeImage}
                          style={{ minHeight: '44px' }}
                        >
                          ❌ Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Section */}
                <div>
                  <h6 className="text-muted small fw-medium mb-3">Rate Your Experience</h6>
                  <StarRating rating={rating} onRatingChange={setRating} />
                  <p className="form-text text-muted mt-2">Click the stars to rate from 1-5</p>
                </div>

                {/* Comment Section */}
                <div>
                  <h6 className="text-muted small fw-medium mb-3">Add a Comment (Optional)</h6>
                  <textarea
                    className="form-control rounded-3"
                    placeholder="Share your thoughts about this experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical', maxHeight: '120px' }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-0 px-4 py-3 px-sm-4 py-sm-4">
              <div className="d-flex flex-column flex-sm-row gap-3 w-100">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4 py-2 order-2 order-sm-1"
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 py-2 order-1 order-sm-2"
                  onClick={handleSave}
                  disabled={isLoading || rating === 0}
                  style={{ minHeight: '44px' }}
                >
                  {isLoading && (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  )}
                  {isLoading ? 'Saving...' : 'Save & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  )

  // Render modal via portal to document.body
  return createPortal(modalContent, document.body)
}
