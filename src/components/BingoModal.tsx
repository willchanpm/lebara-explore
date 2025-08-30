'use client'

import { useState, useRef } from 'react'
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
    <div className="star-rating">
      {/* Display 5 stars, each can be clicked to set the rating */}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= rating ? 'star-filled' : 'star-empty'}`}
          onClick={() => onRatingChange(star)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
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
      
      // Display the camera feed in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
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

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h2 className="modal-title">Complete: {tileLabel}</h2>
            <button 
              type="button" 
              className="modal-close"
              onClick={handleClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Image Section */}
            <div className="image-section">
              <h3 className="section-title">Add a Photo</h3>
              
              {!image && !showCamera && (
                <div className="image-upload-options">
                  {/* Upload from device button */}
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Upload Photo
                  </button>
                  
                  {/* Take photo button */}
                  <button
                    type="button"
                    className="camera-button"
                    onClick={startCamera}
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
                <div className="camera-view">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="camera-video"
                  />
                  <div className="camera-controls">
                    <button
                      type="button"
                      className="capture-button"
                      onClick={capturePhoto}
                    >
                      📸 Capture
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={stopCamera}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}

              {/* Display captured/uploaded image */}
              {image && (
                <div className="image-preview">
                  <img src={image} alt="Bingo completion" className="preview-image" />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={removeImage}
                  >
                    ❌ Remove
                  </button>
                </div>
              )}
            </div>

            {/* Rating Section */}
            <div className="rating-section">
              <h3 className="section-title">Rate Your Experience</h3>
              <StarRating rating={rating} onRatingChange={setRating} />
              <p className="rating-hint">Click the stars to rate from 1-5</p>
            </div>

            {/* Comment Section */}
            <div className="comment-section">
              <h3 className="section-title">Add a Comment (Optional)</h3>
              <textarea
                className="comment-input"
                placeholder="Share your thoughts about this experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="footer-save-button"
              onClick={handleSave}
              disabled={isLoading || rating === 0}
            >
              {isLoading ? 'Saving...' : 'Save & Complete'}
            </button>
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
}
