'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function AuthStatus() {
  // State to store the current user and loading state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Function to get the current user
    const getCurrentUser = async () => {
      try {
        // Fetch the current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          setUser(null)
        } else {
          setUser(user)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Get the current user when the component mounts
    getCurrentUser()

    // Subscribe to authentication state changes
    // This ensures the UI updates automatically when users sign in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update the user state based on the auth event
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup function to unsubscribe when component unmounts
    // This prevents memory leaks and unnecessary API calls
    return () => subscription.unsubscribe()
  }, [])

  // Function to handle user sign out
  const handleSignOut = async () => {
    try {
      // Sign out the current user
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        alert('Failed to sign out. Please try again.')
      } else {
        // The auth state change listener will automatically update the UI
        console.log('User signed out successfully')
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="card-small">
        <div className="status-loading">
          <div className="spinner"></div>
          <p className="text-muted">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  // Show signed in state with user email and sign out button
  if (user) {
    return (
      <div className="auth-status-signed-in">
        <div className="auth-status-content">
          <div className="auth-status-info">
            <div className="status-dot success"></div>
            <p className="auth-status-text">
              Signed in as <span className="auth-status-email">{user.email}</span>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="btn btn-primary auth-signout-button"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Show not signed in state
  return (
    <div className="card-small">
      <div className="auth-status-not-signed">
        <div className="auth-status-info">
          <div className="status-dot inactive"></div>
          <p className="auth-status-text">Not signed in</p>
        </div>
        <a 
          href="/login" 
          className="btn btn-primary auth-signin-button"
        >
          Sign in
        </a>
      </div>
    </div>
  )
}
