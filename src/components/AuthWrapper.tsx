'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthLoading } from './AuthLoadingContext'

interface AuthWrapperProps {
  children: React.ReactNode
  userEmail: string | null // User email from server-side props
}

export default function AuthWrapper({ children, userEmail }: AuthWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setIsAuthLoading } = useAuthLoading()

  // Check if we should skip authentication for login and auth callback pages
  const shouldSkipAuth = pathname === '/login' || pathname.startsWith('/auth/')

  // Update global auth loading state (always false since we have user data from server)
  useEffect(() => {
    setIsAuthLoading(false)
  }, [setIsAuthLoading])

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!shouldSkipAuth && !userEmail) {
      router.push('/login')
    }
  }, [shouldSkipAuth, userEmail, router])

  // Skip authentication check for login and auth callback pages
  if (shouldSkipAuth) {
    return <>{children}</>
  }

  // If we have a user, render the app content
  if (userEmail) {
    return <>{children}</>
  }

  // No user - show loading state while redirecting
  return (
    <div className="loading-container">
      <div className="loading-spinner">Loading...</div>
    </div>
  )
}
