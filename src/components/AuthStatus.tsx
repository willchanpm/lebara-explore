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
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body text-center py-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  // Show signed in state with user email and sign out button
  if (user) {
    return (
      <div className="card bg-white shadow-sm rounded-xl">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="bg-success rounded-circle me-3" style={{ width: '12px', height: '12px' }}></div>
              <div>
                <p className="mb-0 fw-semibold text-dark">
                  Signed in as <span className="text-primary">{user.email}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-outline-danger btn-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show not signed in state
  return (
    <div className="card bg-white shadow-sm rounded-xl">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="bg-secondary rounded-circle me-3" style={{ width: '12px', height: '12px' }}></div>
            <p className="mb-0 fw-semibold text-dark">Not signed in</p>
          </div>
          <a 
            href="/login" 
            className="btn btn-primary btn-sm"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
