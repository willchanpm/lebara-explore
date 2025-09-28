'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUserId } from '@/lib/saveCheckIn'
import { useToast } from './ToastsProvider'

// Interface for the modal props
interface ResetConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onReset: (deletePosts: boolean) => void
  completedCount: number
}

// Main Modal Component
export default function ResetConfirmationModal({ 
  isOpen, 
  onClose, 
  onReset,
  completedCount
}: ResetConfirmationModalProps) {
  // State variables to store the form data
  const [deletePosts, setDeletePosts] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Toast hook
  const toast = useToast()
  
  // Refs for focus management
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  // Handle body scroll and focus when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Prevent background scroll
      document.body.classList.add('modal-open')
      
      // Focus the first button when modal opens
      setTimeout(() => {
        firstButtonRef.current?.focus()
      }, 100)
    } else {
      // Restore background scroll
      document.body.classList.remove('modal-open')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Function to handle reset confirmation
  const handleReset = async () => {
    setIsLoading(true)
    
    try {
      // Get current user ID
      const userId = await getCurrentUserId(supabase)
      
      if (deletePosts) {
        // For "Reset Everything" - delete all check-ins and their photos
        try {
          // First, get photo URLs before deleting records
          const { data: checkIns } = await supabase
            .from('check_ins')
            .select('photo_url')
            .eq('user_id', userId)
            .eq('is_reset', false) // Get active records before deleting
          
          // Delete all check-ins for this user
          const { data: deleteData, error: deleteError } = await supabase
            .from('check_ins')
            .delete()
            .eq('user_id', userId)
            .select()
            
          console.log('Delete records result:', { deleteData, deleteError, userId })
            
          if (deleteError) {
            console.error('Error deleting check-ins:', deleteError)
            toast.error('Failed to delete posts. Please try again.')
            setIsLoading(false)
            return
          }
          
          // Delete associated photos from storage
          if (checkIns && checkIns.length > 0) {
            const photoUrls = checkIns
              .map(checkIn => checkIn.photo_url)
              .filter(Boolean) as string[]
            
            console.log('Photos to delete:', photoUrls)
            
            for (const photoUrl of photoUrls) {
              try {
                // Extract the file path from the URL
                const urlParts = photoUrl.split('/')
                const fileName = urlParts[urlParts.length - 1]
                const boardMonth = urlParts[urlParts.length - 2]
                const userIdFromUrl = urlParts[urlParts.length - 3]
                const storagePath = `checkins/${userIdFromUrl}/${boardMonth}/${fileName}`
                
                console.log('Deleting photo from storage:', storagePath)
                await supabase.storage
                  .from('checkins')
                  .remove([storagePath])
              } catch (storageError) {
                console.warn('Could not delete photo from storage:', storageError)
                // Don't fail the entire operation for storage errors
              }
            }
          }
          
          toast.success('Reset complete! All progress and posts have been deleted.')
        } catch (error) {
          console.error('Error during reset everything:', error)
          toast.error('Error resetting progress. Please try again.')
          setIsLoading(false)
          return
        }
      } else {
        // For "Reset Status Only" - mark as reset but keep posts in feed
        const { data: updateData, error: updateError } = await supabase
          .from('check_ins')
          .update({ is_reset: true })
          .eq('user_id', userId)
          .eq('is_reset', false) // Only update non-reset entries
          .select()
          
        console.log('Reset Status Only result:', { updateData, updateError, userId })
          
        if (updateError) {
          console.error('Error marking check-ins as reset:', updateError)
          toast.error('Failed to reset progress. Please try again.')
          setIsLoading(false)
          return
        }
        
        toast.success('Reset complete! Your progress has been cleared.')
      }
      
      // Call the onReset function with the deletePosts option
      onReset(deletePosts)
      
      // Reset form and close modal
      setDeletePosts(false)
      setIsLoading(false)
      onClose()
      
    } catch (error) {
      console.error('Error during reset:', error)
      
      if (error instanceof Error && error.message === 'User not authenticated') {
        toast.error('Please sign in to reset your progress.')
      } else {
        toast.error('Error resetting progress. Please try again.')
      }
      
      setIsLoading(false)
    }
  }

  // Function to handle modal close
  const handleClose = useCallback(() => {
    // Reset form
    setDeletePosts(false)
    
    onClose()
  }, [onClose])

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
  }, [isOpen, handleClose])

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
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content rounded-4 shadow-lg">
            {/* Modal Header */}
            <div className="modal-header border-0 px-4 py-3">
              <h4 className="modal-title fw-bold mb-0" id="reset-modal-title">
                Reset Bingo Progress
              </h4>
              <button 
                ref={closeButtonRef}
                type="button" 
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
                disabled={isLoading}
              />
            </div>

            {/* Modal Body */}
            <div className="modal-body px-4 py-3">
              <div className="d-flex flex-column gap-4">
                {/* Warning message */}
                <div className="text-center">
                  <div className="fs-1 mb-3">⚠️</div>
                  <p className="lead mb-3">
                    You have completed <strong>{completedCount}</strong> challenges.
                  </p>
                  <p className="text-muted">
                    This action cannot be undone. Choose what you want to reset:
                  </p>
                </div>

                {/* Reset options */}
                <div className="card border-0 bg-body-tertiary rounded-4 p-4">
                  <div className="d-flex flex-column gap-3">
                    {/* Option 1: Reset status only */}
                    <label className="form-check d-flex align-items-start gap-3 p-3 rounded-3 border-0 bg-white shadow-sm">
                      <input
                        type="radio"
                        name="resetOption"
                        className="form-check-input mt-1"
                        checked={!deletePosts}
                        onChange={() => setDeletePosts(false)}
                        disabled={isLoading}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium mb-1">Reset Status Only</div>
                        <div className="text-muted small">
                          Clear your bingo progress but keep your posts and photos in the database. 
                          You can still see your previous check-ins in the feed.
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Reset status and delete posts */}
                    <label className="form-check d-flex align-items-start gap-3 p-3 rounded-3 border-0 bg-white shadow-sm">
                      <input
                        type="radio"
                        name="resetOption"
                        className="form-check-input mt-1"
                        checked={deletePosts}
                        onChange={() => setDeletePosts(true)}
                        disabled={isLoading}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium mb-1">Reset Everything</div>
                        <div className="text-muted small">
                          Clear your bingo progress AND completely delete all your posts and photos. 
                          This will remove everything from the database and storage.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-0 px-4 py-3">
              <div className="d-flex flex-column flex-sm-row gap-3 w-100">
                <button
                  ref={firstButtonRef}
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
                  className="btn btn-danger rounded-pill px-4 py-2 order-1 order-sm-2"
                  onClick={handleReset}
                  disabled={isLoading}
                  style={{ minHeight: '44px' }}
                >
                  {isLoading && (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  )}
                  {isLoading ? 'Resetting...' : 'Reset Progress'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Render modal via portal to document.body
  return createPortal(modalContent, document.body)
}
