'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useAuthLoading } from '@/components/AuthLoadingContext'
import { verifyOtpAction } from '../actions'

export default function LoginPage() {
  const { setIsNavigating, isNavigating } = useAuthLoading()
  
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [otpCode, setOtpCode] = useState('') // Stores the 6-digit OTP code
  const [status, setStatus] = useState('') // Stores the current status message
  const [isLoading, setIsLoading] = useState(false) // Tracks if we're currently sending the OTP
  const [isVerifying, setIsVerifying] = useState(false) // Tracks if we're verifying the OTP
  const [otpSent, setOtpSent] = useState(false) // Tracks if an OTP has been sent
  const [resendCooldown, setResendCooldown] = useState(0) // Tracks resend cooldown timer
  
  // Create a Supabase browser client for sending OTP (only)
  const supabase = createSupabaseBrowser()

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
      setStatus('Please enter an email address')
      return
    }

    try {
      setIsLoading(true) // Show loading state
      setStatus('Sending verification code...')

      // Call Supabase to send an OTP to the user's email
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true // Allow new users to sign up
        }
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus(`Error: ${error.message}`)
      } else {
        // Success! Show confirmation message and update UI state
        setStatus('Verification code sent! Check your email.')
        setOtpSent(true) // Mark that the OTP has been sent
        setResendCooldown(60) // Set 60-second cooldown for resend
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('An unexpected error occurred. Please try again.')
      console.error('OTP send error:', err)
    } finally {
      setIsLoading(false) // Always reset loading state
    }
  }

  // Handle OTP verification using server action
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setStatus('Please enter the complete 6-digit code')
      return
    }

    try {
      setIsVerifying(true) // Show verifying state
      setStatus('Verifying code...')

      // Set global navigation loading state
      setIsNavigating(true)

      // Use server action to verify OTP
      const result = await verifyOtpAction(email.trim(), otpCode)
      
      if (!result.success) {
        // If there's an error, show it to the user
        setStatus(`Error: ${result.error}`)
        setOtpCode('') // Clear the OTP input
        setIsNavigating(false) // Reset navigation state
      }
      // If successful, the server action will redirect automatically
      // No need to handle success case here
      
    } catch (err) {
      // Catch any unexpected errors
      setStatus('Invalid verification code. Please try again.')
      setOtpCode('') // Clear the OTP input
      setIsNavigating(false) // Reset navigation state
      console.error('OTP verification error:', err)
    } finally {
      setIsVerifying(false) // Always reset verifying state
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return // Don't allow resend during cooldown

    try {
      setIsLoading(true)
      setStatus('Resending verification code...')

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus('Verification code resent! Check your email.')
        setResendCooldown(60) // Reset cooldown timer
      }
    } catch (err) {
      setStatus('An unexpected error occurred. Please try again.')
      console.error('OTP resend error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow digits and limit to 6 characters
    if (/^\d{0,6}$/.test(value)) {
      setOtpCode(value)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="form-input"
              required
              disabled={otpSent || isLoading}
            />
          </div>

          {/* OTP Input (shown after OTP is sent) */}
          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                Verification Code
              </label>
              <input
                type="text"
                id="otp"
                value={otpCode}
                onChange={handleOtpChange}
                placeholder="Enter 6-digit code"
                className="form-input otp-input"
                maxLength={6}
                required
                disabled={isVerifying}
                autoComplete="one-time-code"
              />
              <p className="form-help">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`status-message ${status.includes('Error') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={isLoading || isVerifying || isNavigating}
          >
            {isLoading ? 'Sending...' : 
             otpSent ? (isVerifying ? 'Verifying...' : 'Verify Code') : 
             'Send Verification Code'}
          </button>

          {/* Resend OTP Button */}
          {otpSent && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="btn btn-secondary login-resend"
              disabled={resendCooldown > 0 || isLoading || isVerifying}
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : 'Resend Code'
              }
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="text-muted">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}