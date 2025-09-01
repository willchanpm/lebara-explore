'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useAuthLoading } from '@/components/AuthLoadingContext'

export default function LoginPage() {
  const router = useRouter()
  const { setIsNavigating, isNavigating } = useAuthLoading()
  
  // State variables to manage the form and UI
  const [email, setEmail] = useState('') // Stores the email input value
  const [otpCode, setOtpCode] = useState('') // Stores the 6-digit OTP code
  const [status, setStatus] = useState('') // Stores the current status message
  const [isLoading, setIsLoading] = useState(false) // Tracks if we're currently sending the OTP
  const [isVerifying, setIsVerifying] = useState(false) // Tracks if we're verifying the OTP
  const [otpSent, setOtpSent] = useState(false) // Tracks if an OTP has been sent
  const [resendCooldown, setResendCooldown] = useState(0) // Tracks resend cooldown timer
  const [checkingAuth, setCheckingAuth] = useState(true) // Tracks if we're checking authentication

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCheckingAuth(false) // User is authenticated, stop checking
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setCheckingAuth(false) // Stop checking on error
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

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

  // Cleanup effect to ensure checkingAuth is reset when component unmounts
  useEffect(() => {
    return () => {
      setCheckingAuth(false)
    }
  }, [])



  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="login-loading">
        <div className="login-loading-content">
          <p className="text-muted">Checking authentication...</p>
        </div>
      </div>
    )
  }

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

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setStatus('Please enter the complete 6-digit code')
      return
    }

    try {
      setIsVerifying(true) // Show verifying state
      setStatus('Verifying code...')

      // Verify the OTP code with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'email'
      })

      if (error) {
        // If there's an error, show it to the user
        setStatus(`Error: ${error.message}`)
        setOtpCode('') // Clear the OTP input
      } else if (data.user) {
        // Success! User is now logged in
        setStatus('Login successful! Redirecting...')
        
        // Set global navigation loading state
        setIsNavigating(true)
        
        // Reset checkingAuth state since user is now authenticated
        setCheckingAuth(false)
        
        // Redirect immediately - the simplified AuthWrapper will handle the rest
        router.push('/')
        
        // Reset navigation state after a short delay
        setTimeout(() => {
          setIsNavigating(false)
        }, 1000)
      } else {
        throw new Error('Authentication failed - no user data received')
      }
    } catch (err) {
      // Catch any unexpected errors
      setStatus('Invalid verification code. Please try again.')
      setOtpCode('') // Clear the OTP input
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
        setStatus('New verification code sent!')
        setResendCooldown(60) // Reset cooldown timer
        setOtpCode('') // Clear the OTP input
      }
    } catch (err) {
      setStatus('Failed to resend code. Please try again.')
      console.error('Resend OTP error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to reset the form and go back to email input
  const handleReset = () => {
    setOtpSent(false)
    setStatus('')
    setEmail('')
    setOtpCode('')
    setResendCooldown(0)
  }

  // Handle OTP input changes with formatting
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 6) {
      setOtpCode(value)
    }
  }

  // Handle OTP paste events
  const handleOtpPaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const digits = pastedText.replace(/\D/g, '').slice(0, 6) // Get only digits, max 6
    
    if (digits.length > 0) {
      const newOtpCode = otpCode.split('')
      
      // Fill in the boxes starting from the current index
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newOtpCode[index + i] = digits[i]
      }
      
      setOtpCode(newOtpCode.join(''))
      
      // Focus the next empty box or the last box if all filled
      const nextEmptyIndex = newOtpCode.findIndex(char => !char)
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        const nextBox = document.querySelector(`input[data-index="${nextEmptyIndex}"]`) as HTMLInputElement
        if (nextBox) {
          nextBox.focus()
        }
      } else {
        // All boxes filled, focus the last one
        const lastBox = document.querySelector(`input[data-index="5"]`) as HTMLInputElement
        if (lastBox) {
          lastBox.focus()
        }
      }
    }
  }

  // Handle individual OTP box changes
  const handleOtpBoxChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '') // Only allow digits
    
    // Check if this is a paste operation (multiple digits)
    if (digit.length > 1) {
      // Handle paste: distribute digits across boxes
      const pastedCode = digit.slice(0, 6) // Take first 6 digits
      const newOtpCode = otpCode.split('')
      
      // Fill in the boxes with pasted digits
      for (let i = 0; i < pastedCode.length && index + i < 6; i++) {
        newOtpCode[index + i] = pastedCode[i]
      }
      
      const newCode = newOtpCode.join('')
      setOtpCode(newCode)
      
      // Focus the next empty box or the last box if all filled
      const nextEmptyIndex = newOtpCode.findIndex(char => !char)
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        const nextBox = document.querySelector(`input[data-index="${nextEmptyIndex}"]`) as HTMLInputElement
        if (nextBox) {
          nextBox.focus()
        }
      } else {
        // All boxes filled, focus the last one
        const lastBox = document.querySelector(`input[data-index="5"]`) as HTMLInputElement
        if (lastBox) {
          lastBox.focus()
        }
      }
    } else if (digit.length === 1) {
      // Single digit input (normal typing)
      const newOtpCode = otpCode.split('')
      newOtpCode[index] = digit
      const newCode = newOtpCode.join('')
      setOtpCode(newCode)
      
      // Auto-focus next box if digit entered
      if (index < 5) {
        const nextBox = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement
        if (nextBox) {
          nextBox.focus()
        }
      }
    }
  }

  // If OTP was sent, show the verification code input view
  if (otpSent) {
    return (
      <div className="login-page-success">
        <div className="login-container-success">
          {/* Success message */}
          <div className="login-hero">
            <h1 className="success-title">
              Enter Verification Code
            </h1>
            
            <p className="success-subtitle">
              We&apos;ve sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          {/* OTP input form */}
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="otp-form">
            <div className="otp-input-group">
              <label htmlFor="otp" className="otp-label">
                Verification Code
              </label>
              <div className="otp-input-container">
                {Array.from({ length: 6 }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otpCode[i] || ''}
                    onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                    onPaste={(e) => handleOtpPaste(e, i)}
                    className="otp-input-box"
                    disabled={isVerifying}
                    autoFocus={i === 0}
                    autoComplete="one-time-code"
                    data-index={i}
                  />
                ))}
              </div>
              <p className="otp-help-text">
                Enter the 6-digit code from your email
              </p>
              <p className="otp-paste-hint">
                💡 Tip: You can copy and paste the entire code
              </p>
            </div>

            {/* Verify button */}
            <button
              type="submit"
              disabled={isVerifying || otpCode.length !== 6 || isNavigating}
              className="btn btn-primary otp-verify-button"
            >
              {isVerifying ? 'Verifying...' : isNavigating ? 'Redirecting...' : 'Verify Code'}
            </button>
          </form>

          {/* Action buttons */}
          <div className="success-actions">
            <button
              onClick={handleReset}
              disabled={isNavigating}
              className="btn btn-secondary"
            >
              Try Different Email
            </button>
            
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isLoading || isNavigating}
              className="btn btn-outline"
            >
              {isLoading ? 'Sending...' : 
               resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
               isNavigating ? 'Redirecting...' :
               'Resend Code'}
            </button>
          </div>

          {/* Help text */}
          <div className="login-help">
            <p className="login-help-text">
              Didn&apos;t receive the code? Check your spam folder or try resending.
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
            Enter your email to receive a verification code
          </p>
        </div>

        {/* OTP form */}
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
            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
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
            Enter the 6-digit code from your email to sign in. No password required!
          </p>
        </div>
      </div>
    </div>
  )
}
