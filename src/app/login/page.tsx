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
      <div style={{ 
        padding: '20px', 
        maxWidth: '400px', 
        margin: '0 auto', 
        textAlign: 'center',
        backgroundColor: 'var(--background)', // Use CSS variable for consistency
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Success icon - using a more subtle gray */}
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '24px',
          filter: 'grayscale(100%) brightness(0.8)' // Make the emoji more subtle
        }}>
          ✉️
        </div>
        
        {/* Success message - vibrant green for good contrast */}
        <h1 style={{ 
          color: '#10b981', // Emerald green - much better contrast on dark
          marginBottom: '16px', 
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Check Your Inbox!
        </h1>
        
        {/* Description text - light gray for good readability */}
        <p style={{ 
          fontSize: '16px', 
          marginBottom: '32px', 
          color: '#e5e7eb', // Light gray - excellent contrast on dark
          lineHeight: '1.5'
        }}>
          We've sent a magic link to <strong style={{ color: '#f3f4f6' }}>{email || 'your email'}</strong>
        </p>
        
        {/* Instructions box - dark gray with light text for contrast */}
        <div style={{ 
          backgroundColor: '#1f2937', // Dark gray background
          padding: '24px', 
          borderRadius: '12px',
          marginBottom: '32px', 
          border: '1px solid #374151', // Subtle border
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }}>
          <p style={{ 
            marginBottom: '16px', 
            fontWeight: '600',
            color: '#f9fafb', // Very light gray - excellent contrast
            fontSize: '16px'
          }}>
            Next steps:
          </p>
          <ol style={{ 
            textAlign: 'left', 
            margin: '0', 
            paddingLeft: '24px',
            color: '#e5e7eb', // Light gray - good contrast
            lineHeight: '1.6'
          }}>
            <li style={{ marginBottom: '8px' }}>Check your email inbox (and spam folder)</li>
            <li style={{ marginBottom: '8px' }}>Click the magic link in the email</li>
            <li style={{ marginBottom: '0' }}>You'll be automatically signed in!</li>
          </ol>
        </div>
        
        {/* Action buttons - better colors for dark mode */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 20px',
              backgroundColor: '#374151', // Darker gray - better for dark mode
              color: '#f9fafb', // Very light text for contrast
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4b5563' // Lighter on hover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#374151'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Try Different Email
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#3b82f6', // Blue that works well in dark mode
              color: '#ffffff', // Pure white for maximum contrast
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb' // Darker blue on hover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Resend Link
          </button>
        </div>
        
        {/* Additional help text - dark gray box with light text */}
        <div style={{ 
          fontSize: '14px', 
          color: '#d1d5db', // Light gray text
          lineHeight: '1.5',
          padding: '16px',
          backgroundColor: '#111827', // Very dark gray background
          borderRadius: '8px',
          border: '1px solid #1f2937' // Subtle border
        }}>
          <p style={{ margin: '0' }}>
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '400px', 
      margin: '0 auto',
      backgroundColor: 'var(--background)', // Use CSS variable for consistency
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      {/* Page header */}
      <h1 style={{ 
        color: 'var(--foreground)', // Use CSS variable for consistency
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '8px',
        textAlign: 'center'
      }}>Login</h1>
      <p style={{ 
        color: '#d1d5db', // Light gray text
        textAlign: 'center',
        marginBottom: '32px'
      }}>Enter your email to receive a magic link</p>

      {/* Magic link form */}
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{ 
            display: 'block', 
            marginBottom: '8px',
            color: '#e5e7eb', // Light gray text
            fontWeight: '500'
          }}>
            Email:
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
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #374151', // Dark gray border
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#1f2937', // Dark gray background
              color: '#f9fafb', // Light text
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#374151' : '#3b82f6', // Blue when not loading
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '500'
          }}
        >
          Send magic link
        </button>
      </form>

      {/* Status message display */}
      {status && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: status.includes('Error') ? '#1f2937' : '#1e3a8a', // Dark backgrounds
          border: `1px solid ${status.includes('Error') ? '#dc2626' : '#3b82f6'}`, // Red or blue borders
          borderRadius: '8px',
          textAlign: 'center',
          color: status.includes('Error') ? '#fca5a5' : '#93c5fd' // Light red or light blue text
        }}>
          {status}
        </div>
      )}

      {/* Additional information */}
      <div style={{ 
        marginTop: '24px', 
        fontSize: '14px', 
        color: '#9ca3af', // Medium gray text
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        <p>Click the link in your email to sign in.</p>
        <p>No password required!</p>
      </div>
    </div>
  )
}
