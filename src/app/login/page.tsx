'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [status, setStatus] = useState('') // Stores the current status message
  const [isLoading, setIsLoading] = useState(false) // Tracks if we're currently sending the magic link
  const [linkSent, setLinkSent] = useState(false) // Tracks if a magic link has been sent
  const [checkingAuth, setCheckingAuth] = useState(true) // Tracks if we're checking authentication

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="login-loading">
        <div className="login-loading-content">
          <div className="spinner"></div>
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent the default form submission behavior
    
    // Don't submit if email is empty
    if (!email.trim()) {
      setStatus('Please enter an email address')
      return
    }

    try {
      setIsLoading(true) // Show loading state
      setStatus('Sending...')

      // Call Supabase to send a magic link to the user's email
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus(`Error: ${error.message}`)
      } else {
        // Success! Show confirmation message and update UI state
        setStatus('Magic link sent successfully!')
        setEmail('') // Clear the email input
        setLinkSent(true) // Mark that the link has been sent
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('An unexpected error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false) // Always reset loading state
    }
  }

  // Function to reset the form and go back to email input
  const handleReset = () => {
    setLinkSent(false)
    setStatus('')
    setEmail('')
  }

  // If magic link was sent, show the "check your inbox" view
  if (linkSent) {
    return (
      <div className="login-page-success">
        <div className="login-container-success">
          {/* Success message */}
          <div className="login-hero">
            <h1 className="success-title">
              Check Your Inbox!
            </h1>
            
            <p className="success-subtitle">
              We&apos;ve sent a magic link to <strong>{email || 'your email'}</strong>
            </p>
          </div>

          {/* Instructions box */}
          <div className="success-instructions">
            <h3>Next steps</h3>
            <ol>
              <li>
                <span className="step-number">1.</span>
                Check your email inbox (and spam folder)
              </li>
              <li>
                <span className="step-number">2.</span>
                Click the magic link in the email
              </li>
              <li>
                <span className="step-number">3.</span>
                You&apos;ll be automatically signed in!
              </li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="success-actions">
            <button
              onClick={handleReset}
              className="btn btn-secondary"
            >
              Try Different Email
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Resend Link
            </button>
          </div>

          {/* Help text */}
          <div className="login-help">
            <p className="login-help-text">
              Didn&apos;t receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Page header */}
        <div className="login-hero">
          <h1 className="login-title">
            Login
          </h1>
          <p className="login-subtitle">
            Enter your email to receive a magic link
          </p>
        </div>

        {/* Magic link form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isLoading}
              className="login-input"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary login-button"
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {/* Status message display */}
        {status && (
          <div className={`login-status ${status.includes('Error') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}

        {/* Additional information */}
        <div className="login-help">
          <p className="login-help-text">
            Click the link in your email to sign in. No password required!
          </p>
        </div>
      </div>
    </div>
  )
}
