'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if we should skip authentication for login and auth callback pages
  const shouldSkipAuth = pathname === '/login' || pathname.startsWith('/auth/')

  useEffect(() => {
    // Skip authentication check for login and auth callback pages
    if (shouldSkipAuth) {
      setLoading(false)
      return
    }

    // Check current authentication status
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error checking auth:', error)
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

    // Get current user
    checkAuth()

    // Subscribe to authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
  }, [router, shouldSkipAuth])

  // Skip authentication check for login and auth callback pages
  if (shouldSkipAuth) {
    return <>{children}</>
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto"></div>
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner mx-auto"></div>
          <p className="text-muted">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}
