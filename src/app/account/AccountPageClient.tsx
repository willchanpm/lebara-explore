'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useAuthLoading } from '@/components/AuthLoadingContext'
import { verifyOtpAction } from '../actions'

interface AccountPageClientProps {
  userEmail: string | null // User email from server-side props (not used in this component)
}

export default function AccountPageClient({ userEmail: _userEmail }: AccountPageClientProps) {
  const { isNavigating } = useAuthLoading()
  
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [otpCode, setOtpCode] = useState('') // Stores the 6-digit OTP code
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'success' | 'error'>('idle') // Tracks the current status
  const [message, setMessage] = useState('') // Stores status messages to display to the user
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

  // Handle OTP verification using server action
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setStatus('error')
      setMessage('Please enter the complete 6-digit code')
      return
    }

    try {
      setStatus('verifying') // Show verifying state
      setMessage('Verifying code...')

      // Use server action to verify OTP
      const result = await verifyOtpAction(email.trim(), otpCode)
      
      if (!result.success) {
        // If there's an error, show it to the user
        setStatus('error')
        setMessage(result.error || 'Verification failed')
        setOtpCode('') // Clear the OTP input
      }
      // If successful, the server action will redirect automatically
      // No need to handle success case here
      
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
        setMessage(error.message || 'Failed to resend verification code')
      } else {
        setStatus('success')
        setMessage('Verification code resent! Check your email.')
        setResendCooldown(60) // Reset cooldown timer
      }
    } catch (err) {
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
      console.error('OTP resend error:', err)
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
    <div className="account-page">
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <h1 className="account-title">Account</h1>
          <p className="account-subtitle">Manage your account settings</p>
        </div>

        {/* Account Form */}
        <form onSubmit={handleSubmit} className="account-form">
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
              disabled={otpSent || status === 'sending'}
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
                disabled={status === 'verifying'}
                autoComplete="one-time-code"
              />
              <p className="form-help">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`status-message ${status === 'error' ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary account-submit"
            disabled={status === 'sending' || status === 'verifying' || isNavigating}
          >
            {status === 'sending' ? 'Sending...' : 
             otpSent ? (status === 'verifying' ? 'Verifying...' : 'Verify Code') : 
             'Send Verification Code'}
          </button>

          {/* Resend OTP Button */}
          {otpSent && (
            <button
              type="button"
              onClick={handleResendOtp}
              className="btn btn-secondary account-resend"
              disabled={resendCooldown > 0 || status === 'sending' || status === 'verifying'}
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : 'Resend Code'
              }
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="account-footer">
          <p className="text-muted">
            By updating your account, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
