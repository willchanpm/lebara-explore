'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { useAuthLoading } from './AuthLoadingContext'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { setIsAuthLoading } = useAuthLoading()

  // Check if we should skip authentication for login and auth callback pages
  const shouldSkipAuth = pathname === '/login' || pathname.startsWith('/auth/')

  // Memoized auth check function to prevent unnecessary re-runs
  const checkAuth = useCallback(async () => {
    try {
      console.log('Checking authentication...')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      } else {
        console.log('Auth check result:', user ? `User ID: ${user.id}` : 'No user')
        setUser(user)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Skip authentication check for login and auth callback pages
    if (shouldSkipAuth) {
      setLoading(false)
      return
    }

    // Check current authentication status
    checkAuth()

    // Subscribe to authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Redirect to login if user signs out
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [router, shouldSkipAuth, checkAuth])

  // Handle redirect to login if not authenticated
  useEffect(() => {
    console.log('Redirect check:', { user: !!user, loading, shouldSkipAuth })
    if (!user && !loading && !shouldSkipAuth) {
      // Only redirect if we're not already on the login page
      console.log('Redirecting to login...')
      router.push('/login')
    }
  }, [user, loading, router, shouldSkipAuth])

  // Handle redirect when no user and not loading
  useEffect(() => {
    if (!user && !loading && !shouldSkipAuth) {
      console.log('No user, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, router, shouldSkipAuth])

  // Update global auth loading state
  useEffect(() => {
    setIsAuthLoading(loading)
  }, [loading, setIsAuthLoading])

  // Skip authentication check for login and auth callback pages
  if (shouldSkipAuth) {
    console.log('Skipping auth for:', pathname)
    return <>{children}</>
  }

  // Show loading state while checking authentication
  if (loading) {
    console.log('Showing loading state - loading:', loading, 'user:', !!user)
    return null // Show nothing while loading
  }

  // If we have a user, render the app content
  if (user) {
    console.log('User authenticated, rendering children')
    return <>{children}</>
  }

  // No user and not loading - redirect to login without showing anything
  console.log('No user, redirecting to login')
  return null // Show nothing while redirecting
}
