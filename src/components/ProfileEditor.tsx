'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Toast from './Toast'
import type { User } from '@supabase/supabase-js'

// Interface for profile data
interface Profile {
  user_id: string
  display_name: string | null
}

// Interface for toast state
interface ToastState {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
}

// ProfileEditor component for editing display name
export default function ProfileEditor() {
  // State variables
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false
  })

  // Load user and profile data on mount
  useEffect(() => {
    loadUserAndProfile()
  }, [])

  // Function to load current user and their profile
  const loadUserAndProfile = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error fetching user:', userError)
        showToast('Failed to load user data', 'error')
        return
      }
      
      if (!user) {
        setUser(null)
        return
      }
      
      setUser(user)
      
      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('user_id', user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', profileError)
        showToast('Failed to load profile data', 'error')
        return
      }
      
      // Set profile data (or null if no profile exists)
      setProfile(profileData)
      
      // Set display name in input (from profile or empty)
      if (profileData?.display_name) {
        setDisplayName(profileData.display_name)
      } else {
        setDisplayName('')
      }
      
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

  // Function to handle saving the display name
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
    
    try {
      setIsSaving(true)
      
      // Upsert profile with display name
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { 
            user_id: user.id, 
            display_name: trimmedName 
          },
          { 
            onConflict: 'user_id' 
          }
        )
      
      if (error) {
        console.error('Error saving profile:', error)
        showToast('Failed to save display name', 'error')
        return
      }
      
      // Update local state
      setDisplayName(trimmedName)
      setProfile(prev => prev ? { ...prev, display_name: trimmedName } : { user_id: user.id, display_name: trimmedName })
      
      // Show success message
      showToast('Display name saved successfully!', 'success')
      
      // Refetch profile to confirm
      await loadUserAndProfile()
      
    } catch (error) {
      console.error('Unexpected error saving profile:', error)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Function to use email name (extract prefix before @)
  const useEmailName = () => {
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0]
      setDisplayName(emailPrefix)
    }
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
  if (!user) {
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
              <input
                id="display-name"
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
                disabled={isSaving}
                aria-describedby="display-name-help"
              />
              <div className="form-help" id="display-name-help">
                <span className="char-count">{displayName.length}/50</span>
                {user.email && (
                  <button
                    type="button"
                    onClick={useEmailName}
                    className="use-email-link"
                    disabled={isSaving}
                  >
                    Use email name
                  </button>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="btn btn-primary save-button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
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
