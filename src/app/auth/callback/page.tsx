'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  // State to track the authentication status and any errors
  const [status, setStatus] = useState<string>('Processing authentication...')
  const [error, setError] = useState<string | null>(null)
  
  // Next.js router hook for navigation
  const router = useRouter()

  useEffect(() => {
    // This function handles both magic link authentication styles
    const handleAuthCallback = async () => {
      try {
        // First, try the PKCE-style flow (with ?code= parameter)
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        
        if (code) {
          // PKCE flow: Exchange the temporary code for a user session
          // This is the key step that completes the magic link login
          const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (authError) {
            throw authError
          }

          if (data.user) {
            // Success! User is now logged in
            setStatus('Logged in! Redirecting...')
            
            // Wait a moment to show the success message, then redirect to home
            setTimeout(() => {
              router.push('/')
            }, 1500)
            return
          } else {
            throw new Error('Authentication failed - no user data received')
          }
        }

        // If no code parameter, try the hash-token flow
        // Parse the URL hash for access_token and refresh_token
        const hash = window.location.hash.substring(1) // Remove the leading '#'
        const hashParams = new URLSearchParams(hash)
        
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Hash-token flow: Set the session directly with the tokens
          const { data, error: authError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (authError) {
            throw authError
          }

          if (data.user) {
            // Success! User is now logged in
            setStatus('Logged in! Redirecting...')
            
            // Wait a moment to show the success message, then redirect to home
            setTimeout(() => {
              router.push('/')
            }, 1500)
            return
          } else {
            throw new Error('Authentication failed - no user data received')
          }
        }

        // If neither flow has the required parameters, throw an error
        throw new Error('No authentication code or tokens found in URL')
        
      } catch (err) {
        // Handle any errors that occur during authentication
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMessage)
        setStatus('Authentication failed')
      }
    }

    // Call the authentication handler when the component mounts
    handleAuthCallback()
  }, [router]) // The router dependency ensures this effect runs when the router changes

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {/* Show the current status */}
        <p className="text-lg mb-4">{status}</p>
        
        {/* Show any errors if they occur */}
        {error && (
          <div className="text-red-600">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
