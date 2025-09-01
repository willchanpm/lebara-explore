'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [otpCode, setOtpCode] = useState('') // Stores the 6-digit OTP code
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle') // Tracks the current status
  const [message, setMessage] = useState('') // Stores status messages to display to the user
  const [otpSent, setOtpSent] = useState(false) // Tracks if an OTP has been sent
  const [resendCooldown, setResendCooldown] = useState(0) // Tracks resend cooldown timer

  // Handle resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [resendCooldown])

  // Auto-submit OTP when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && otpSent) {
      handleVerifyOtp()
    }
  }, [otpCode, otpSent])

  // Handle form submission - send OTP
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
      setMessage('Sending verification code...')

      // Call Supabase to send an OTP to the user's email
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true // Allow new users to sign up
        }
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus('error')
        setMessage(error.message || 'Failed to send verification code')
      } else {
        // Success! Show confirmation message
        setStatus('success')
        setMessage('Verification code sent! Check your email.')
        setOtpSent(true) // Mark that the OTP has been sent
        setResendCooldown(60) // Set 60-second cooldown for resend
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
      console.error('OTP send error:', err)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter the complete 6-digit code')
      return
    }

    try {
      setStatus('verifying') // Show verifying state
      setMessage('Verifying code...')

      // Verify the OTP code with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email'
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus('error')
        setMessage(error.message || 'Invalid verification code')
        setOtpCode('') // Clear the OTP input
      } else if (data.user) {
        // Success! User is now logged in
        setStatus('success')
        setMessage('Account access granted! You are now signed in.')
        
        // Clear the form
        setEmail('')
        setOtpCode('')
        setOtpSent(false)
      } else {
        throw new Error('Authentication failed - no user data received')
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('error')
      setMessage('Invalid verification code. Please try again.')
      setOtpCode('') // Clear the OTP input
      console.error('OTP verification error:', err)
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return // Don't allow resend during cooldown

    try {
      setStatus('sending')
      setMessage('Resending verification code...')

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        setStatus('error')
        setMessage(error.message || 'Failed to resend code')
      } else {
        setStatus('success')
        setMessage('New verification code sent!')
        setResendCooldown(60) // Reset cooldown timer
        setOtpCode('') // Clear the OTP input
      }
    } catch (err) {
      setStatus('error')
      setMessage('Failed to resend code. Please try again.')
      console.error('Resend OTP error:', err)
    }
  }

  // Handle OTP input changes with formatting
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 6) {
      setOtpCode(value)
    }
  }

  // Function to reset the form
  const handleReset = () => {
    setOtpSent(false)
    setStatus('idle')
    setMessage('')
    setEmail('')
    setOtpCode('')
    setResendCooldown(0)
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
    <div className="account-page">
      <div className="account-container">
        {/* Page header */}
        <div className="account-header">
          <div className="account-icon">
            <span className="account-icon-emoji">🔐</span>
          </div>
          
          <h1 className="account-title">
            Sign In
          </h1>
          <p className="account-subtitle">
            {otpSent ? 'Enter the verification code' : 'Enter your email to receive a verification code'}
          </p>
        </div>

        {/* OTP form */}
        {!otpSent ? (
          <form className="account-form" onSubmit={handleSubmit}>
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
                {status === 'sending' ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          </form>
        ) : (
          <form className="account-form" onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
            <div>
              <label htmlFor="otp" className="sr-only">
                Verification code
              </label>
                          <div className="otp-input-container">
              <input
                id="otp"
                name="otp"
                type="text"
                autoComplete="one-time-code"
                required
                value={otpCode}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="otp-input"
                disabled={status === 'verifying'} // Disable input while verifying
                autoFocus
              />
              <div className="otp-underscores">
                {Array.from({ length: 6 }, (_, i) => (
                  <span 
                    key={i} 
                    className={`otp-underscore ${i < otpCode.length ? 'filled' : ''}`}
                  >
                    {otpCode[i] || '_'}
                  </span>
                ))}
              </div>
            </div>
              <p className="text-sm text-muted mt-2 text-center">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            {/* Verify button */}
            <div>
              <button
                type="submit"
                disabled={status === 'verifying' || otpCode.length !== 6}
                className="btn btn-primary w-full"
              >
                {status === 'verifying' ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            {/* Resend button */}
            <div>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || status === 'sending'}
                className="btn btn-outline w-full"
              >
                {status === 'sending' ? 'Sending...' : 
                 resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
                 'Resend Code'}
              </button>
            </div>

            {/* Back to email button */}
            <div>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary w-full"
              >
                Try Different Email
              </button>
            </div>
          </form>
        )}

        {/* Status message display */}
        {message && (
          <div className={`account-status ${getStatusClasses()}`}>
            {message}
          </div>
        )}

        {/* Additional information */}
        <div className="account-info">
          <p className="account-info-text">
            {otpSent ? 
              'Enter the 6-digit code from your email to sign in. No password required!' :
              'Enter the verification code from your email to sign in. No password required!'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
