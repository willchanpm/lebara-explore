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
      
    } catch (err: unknown) {
      // Check if this is a Next.js redirect (which is expected on success)
      if (err && typeof err === 'object' && 'digest' in err && 
          typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
        // This is a successful redirect, don't show error
        return
      }
      
      // Catch any unexpected errors
      setStatus('Invalid verification code. Please try again.')
      setOtpCode('') // Clear the OTP input
      setIsNavigating(false) // Reset navigation state
      console.error('OTP verification error:', err)
    } finally {
      setIsVerifying(false) // Always reset verifying state
    }
  }

  // Auto-submit OTP when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && otpSent) {
      handleVerifyOtp()
    }
  }, [otpCode, otpSent, handleVerifyOtp])

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

  // Handle OTP input change for individual digits
  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digits for individual input
    if (/^\d$/.test(value) || value === '') {
      const newOtpCode = otpCode.split('')
      newOtpCode[index] = value
      setOtpCode(newOtpCode.join(''))
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  // Handle paste event
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    
    // Extract only digits and limit to 6
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    setOtpCode(digits)
    
    // Focus the last filled input or the last input if all are filled
    const lastIndex = Math.min(digits.length - 1, 5)
    const lastInput = document.getElementById(`otp-${lastIndex}`)
    lastInput?.focus()
  }

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header" style={{ textAlign: 'center' }}>
          <h1 className="login-title">
            {otpSent ? 'Check your email' : 'Welcome'}
          </h1>
          {otpSent ? (
            <p className="login-subtitle">
              Enter the 6-digit code we sent to you. If you&apos;re new, your account will be created after you verify.
            </p>
          ) : (
            <p className="login-subtitle" style={{ display: 'none' }}></p>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Helper text for email step */}
          {!otpSent && (
            <p className="form-help" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
              We&apos;ll email you a 6-digit code. If you&apos;re new, your account will automatically be created after you verify.
            </p>
          )}

          {/* Email Input - only show when not in OTP step */}
          {!otpSent && (
            <div className="form-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="form-input"
                style={{ fontSize: '1.125rem' }}
                required
                disabled={isLoading}
              />
            </div>
          )}

          {/* OTP Input (shown after OTP is sent) */}
          {otpSent && (
            <div className="form-group">
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    id={`otp-${index}`}
                    value={otpCode[index] || ''}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="form-input"
                    style={{
                      width: '3rem',
                      height: '3rem',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      padding: '0'
                    }}
                    maxLength={1}
                    required
                    disabled={isVerifying}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`status-message ${status.includes('Error') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            {otpSent ? (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="btn btn-secondary"
                  disabled={resendCooldown > 0 || isLoading || isVerifying}
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : 'Resend'
                  }
                </button>
                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={isLoading || isVerifying || isNavigating}
                >
                  {isVerifying ? 'Verifying...' : 'Sign In'}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={isLoading || isVerifying || isNavigating}
              >
                {isLoading ? 'Sending...' : 'Continue'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}