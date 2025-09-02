'use client'

import { useState, useEffect } from 'react'
import { loadProfileAction, saveProfileAction } from '@/app/actions'
import Toast from './Toast'

// Interface for toast state
interface ToastState {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
}

// ProfileEditor component for editing display name
interface ProfileEditorProps {
  userEmail: string | null
}

export default function ProfileEditor({ userEmail }: ProfileEditorProps) {
  // State variables
  const [displayName, setDisplayName] = useState('')
  const [originalDisplayName, setOriginalDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false
  })
  
  // Load profile data on mount
  useEffect(() => {
    if (userEmail) {
      loadProfile()
    }
  }, [userEmail]) // eslint-disable-line react-hooks/exhaustive-deps

  // Function to load user's profile using server action
  const loadProfile = async () => {
    if (!userEmail) return
    
    try {
      setIsLoading(true)
      
      // Use server action to load profile data
      const result = await loadProfileAction(userEmail)
      
      if (!result.success) {
        console.error('Error loading profile:', result.error)
        showToast(result.error || 'Failed to load profile data', 'error')
        return
      }
      
      // Set display name in input (from profile data or empty)
      const displayNameValue = result.data?.displayName || ''
      setDisplayName(displayNameValue)
      setOriginalDisplayName(displayNameValue)
      
    } catch (error) {
      console.error('Unexpected error loading profile:', error)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to show toast notifications
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }

  // Function to handle saving the display name using server action
  const handleSave = async () => {
    // Validate input
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      showToast('Display name cannot be empty', 'error')
      return
    }
    
    if (trimmedName.length > 50) {
      showToast('Display name must be 50 characters or less', 'error')
      return
    }
    
    if (!userEmail) {
      showToast('User not authenticated', 'error')
      return
    }
    
    try {
      setIsSaving(true)
      
      // Use server action to save profile data
      const result = await saveProfileAction(userEmail, trimmedName)
      
      if (!result.success) {
        console.error('Error saving profile:', result.error)
        showToast(result.error || 'Failed to save display name', 'error')
        return
      }
      
      // Update local state
      setDisplayName(trimmedName)
      setOriginalDisplayName(trimmedName)
      setIsEditing(false)
      
      // Show success message
      showToast('Display name saved successfully!', 'success')
      
      // Refetch profile to confirm
      await loadProfile()
      
    } catch (error) {
      console.error('Unexpected error saving profile:', error)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Function to enter edit mode
  const handleEdit = () => {
    setIsEditing(true)
  }

  // Function to cancel editing and revert changes
  const handleCancel = () => {
    setDisplayName(originalDisplayName)
    setIsEditing(false)
  }

  // Function to close toast
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="card-small">
        <div className="profile-editor-loading">
          <div className="spinner"></div>
          <p className="text-muted">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Show sign-in CTA if not authenticated
  if (!userEmail) {
    return null // This will be handled by AuthStatus component
  }

  return (
    <>
      <div className="card-small">
        <div className="profile-editor">
          <h3 className="profile-editor-title">Display Name</h3>
          
          <div className="profile-editor-form">
            <div className="form-group">
              <label htmlFor="display-name" className="sr-only">
                Display Name
              </label>
              <div className="input-with-button">
                <div className="input-container">
                  <input
                    id="display-name"
                    type="text"
                    className={`form-input ${!isEditing ? 'form-input-disabled' : ''}`}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={50}
                    disabled={!isEditing || isSaving}
                  />
                  {/* Edit icon that appears when not editing */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="edit-icon-button"
                      disabled={isLoading}
                      aria-label="Edit display name"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Save/Cancel buttons - only show when editing, below the input */}
                {isEditing && (
                  <div className="profile-editor-actions">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary cancel-button"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !displayName.trim() || displayName.trim() === originalDisplayName}
                      className="btn btn-primary save-button"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </>
  )
}
