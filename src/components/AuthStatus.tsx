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
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Loading authentication status...</p>
      </div>
    )
  }

  // Show signed in state with user email and sign out button
  if (user) {
    return (
      <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-green-800">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Show not signed in state
  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
      <p className="text-gray-600">Not signed in</p>
    </div>
  )
}
