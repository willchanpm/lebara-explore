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
        return 'text-blue-600' // Blue for sending state
      case 'success':
        return 'text-green-600' // Green for success
      case 'error':
        return 'text-red-600' // Red for errors
      default:
        return 'text-gray-600' // Default gray color
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Page header */}
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign In
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
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
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              disabled={status === 'sending'} // Disable input while sending
            />
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={status === 'sending'} // Disable button while sending
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>
        </form>

        {/* Status message display */}
        {message && (
          <div className={`text-center text-sm ${getStatusClasses()}`}>
            {message}
          </div>
        )}

        {/* Additional information */}
        <div className="text-center text-xs text-gray-500">
          <p>Click the link in your email to sign in to your account.</p>
          <p className="mt-1">No password required!</p>
        </div>
      </div>
    </div>
  )
}
