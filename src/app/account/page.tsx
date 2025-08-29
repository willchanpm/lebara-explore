'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle') // Tracks the current status
  const [message, setMessage] = useState('') // Stores status messages to display to the user

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent the default form submission behavior
    
    // Don't submit if email is empty
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter an email address')
      return
    }

    try {
      setStatus('sending') // Show "Sending..." status
      setMessage('Sending...')

      // Get the redirect URL from environment variables or use localhost as fallback
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      // Call Supabase to send a magic link to the user's email
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl // Where to redirect after clicking the magic link
        }
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus('error')
        setMessage(error.message || 'Failed to send magic link')
      } else {
        // Success! Show confirmation message
        setStatus('success')
        setMessage('Magic link sent! Check your email and click the link to sign in.')
        setEmail('') // Clear the email input
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
      console.error('Magic link error:', err)
    }
  }

  // Function to get the appropriate CSS classes based on status
  const getStatusClasses = () => {
    switch (status) {
      case 'sending':
        return 'text-brand-accent' // Pink for sending state
      case 'success':
        return 'text-green-500' // Green for success
      case 'error':
        return 'text-red-500' // Red for errors
      default:
        return 'text-muted' // Default muted color
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-md w-full space-y-8">
        {/* Page header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-lebara-lg flex items-center justify-center mb-6 bg-card border-2 border-border shadow-lebara mx-auto">
            <span className="text-3xl">🔐</span>
          </div>
          
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Sign In
          </h1>
          <p className="text-muted">
            Enter your email to receive a magic link
          </p>
        </div>

        {/* Magic link form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="form-input"
              disabled={status === 'sending'} // Disable input while sending
            />
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={status === 'sending'} // Disable button while sending
              className="btn btn-primary w-full"
            >
              {status === 'sending' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>
        </form>

        {/* Status message display */}
        {message && (
          <div className={`text-center text-sm p-4 rounded-lebara border ${getStatusClasses()}`}>
            {message}
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
