'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [status, setStatus] = useState('') // Stores the current status message
  const [isLoading, setIsLoading] = useState(false) // Tracks if we're currently sending the magic link
  const [linkSent, setLinkSent] = useState(false) // Tracks if a magic link has been sent

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
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          {/* Success icon and message */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-lebara-lg flex items-center justify-center mb-6 bg-card border-2 border-border shadow-lebara mx-auto">
              <span className="text-3xl">✉️</span>
            </div>
            
            <h1 className="text-2xl font-bold text-brand-navy mb-2">
              Check Your Inbox!
            </h1>
            
            <p className="text-muted mb-6">
              We've sent a magic link to <strong className="text-brand-navy">{email || 'your email'}</strong>
            </p>
          </div>

          {/* Instructions box */}
          <div className="card">
            <h3 className="font-semibold text-brand-navy mb-3">Next steps:</h3>
            <ol className="text-muted space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-brand-accent mr-2">1.</span>
                Check your email inbox (and spam folder)
              </li>
              <li className="flex items-start">
                <span className="text-brand-accent mr-2">2.</span>
                Click the magic link in the email
              </li>
              <li className="flex items-start">
                <span className="text-brand-accent mr-2">3.</span>
                You'll be automatically signed in!
              </li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="btn btn-secondary flex-1"
            >
              Try Different Email
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary flex-1"
            >
              Resend Link
            </button>
          </div>

          {/* Help text */}
          <div className="gradient-brand rounded-lebara-lg p-4 border border-border text-center">
            <p className="text-brand-navy/80 text-sm">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Page header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-lebara-lg flex items-center justify-center mb-6 bg-card border-2 border-border shadow-lebara mx-auto">
            <span className="text-3xl">🔐</span>
          </div>
          
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Login
          </h1>
          <p className="text-muted">
            Enter your email to receive a magic link
          </p>
        </div>

        {/* Magic link form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-navy mb-2">
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
              className="form-input"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {/* Status message display */}
        {status && (
          <div className={`text-center text-sm p-4 rounded-lebara border ${
            status.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {status}
          </div>
        )}

        {/* Additional information */}
        <div className="gradient-brand rounded-lebara-lg p-4 border border-border text-center">
          <p className="text-brand-navy/80 text-sm">
            Click the link in your email to sign in. No password required!
          </p>
        </div>
      </div>
    </div>
  )
}
