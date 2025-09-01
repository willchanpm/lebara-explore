'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthLoadingContextType {
  isAuthLoading: boolean
  isNavigating: boolean
  setIsAuthLoading: (loading: boolean) => void
  setIsNavigating: (navigating: boolean) => void
}

const AuthLoadingContext = createContext<AuthLoadingContextType | undefined>(undefined)

export function AuthLoadingProvider({ children }: { children: ReactNode }) {
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  return (
    <AuthLoadingContext.Provider 
      value={{ 
        isAuthLoading, 
        isNavigating, 
        setIsAuthLoading, 
        setIsNavigating 
      }}
    >
      {children}
    </AuthLoadingContext.Provider>
  )
}

export function useAuthLoading() {
  const context = useContext(AuthLoadingContext)
  if (context === undefined) {
    throw new Error('useAuthLoading must be used within an AuthLoadingProvider')
  }
  return context
}
