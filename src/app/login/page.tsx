'use client'

import { useState, useEffect, useCallback } from 'react'
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


  // Cleanup effect to ensure checkingAuth is reset when component unmounts
  useEffect(() => {
    return () => {
      setCheckingAuth(false)
    }
  }, [])

  // Handle OTP verification
  const handleVerifyOtp = useCallback(async () => {
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
  }, [otpCode, email, setStatus, setIsVerifying, setOtpCode, setIsNavigating, setCheckingAuth, router])

  // Auto-submit OTP when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6 && otpSent) {
      handleVerifyOtp()
    }
  }, [otpCode, otpSent, handleVerifyOtp])

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Checking authentication...</p>
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
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true // Allow new users to sign up
        }
      })

      // Debug logging
      console.log('OTP Send Response:', { data, error })

      if (error) {
        // If there's an error, show it to the user
        console.error('OTP Send Error:', error)
        setStatus(`Error: ${error.message}`)
      } else {
        // Success! Show confirmation message and update UI state
        console.log('OTP sent successfully to:', email.trim())
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

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      })

      // Debug logging
      console.log('OTP Resend Response:', { data, error })

      if (error) {
        console.error('OTP Resend Error:', error)
        setStatus(`Error: ${error.message}`)
      } else {
        console.log('OTP resent successfully to:', email.trim())
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
      <div className="d-flex align-items-center justify-content-center min-vh-100 py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div className="card shadow-sm rounded-xl">
                <div className="card-body p-4">
                  {/* Success message */}
                  <div className="text-center mb-4">
                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                      <i className="bi bi-envelope-check text-success" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <h1 className="h4 fw-bold mb-2">
                      Enter Verification Code
                    </h1>
                    
                    <p className="text-muted mb-0">
                      We&apos;ve sent a 6-digit code to <strong>{email}</strong>
                    </p>
                  </div>

                  {/* OTP input form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
                    <div className="mb-4">
                      <label htmlFor="otp" className="form-label fw-semibold">
                        Verification Code
                      </label>
                      <div className="d-flex gap-2 justify-content-center mb-3">
                        {Array.from({ length: 6 }, (_, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            value={otpCode[i] || ''}
                            onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                            onPaste={(e) => handleOtpPaste(e, i)}
                            className="form-control text-center fw-bold"
                            style={{ width: '3rem', height: '3rem', fontSize: '1.25rem' }}
                            disabled={isVerifying}
                            autoFocus={i === 0}
                            autoComplete="one-time-code"
                            data-index={i}
                          />
                        ))}
                      </div>
                      <p className="text-muted small text-center mb-2">
                        Enter the 6-digit code from your email
                      </p>
                      <p className="text-info small text-center mb-0">
                        💡 Tip: You can copy and paste the entire code
                      </p>
                    </div>

                    {/* Verify button */}
                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length !== 6 || isNavigating}
                      className="btn btn-primary w-100 mb-3"
                    >
                      {isVerifying ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Verifying...
                        </>
                      ) : isNavigating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Redirecting...
                        </>
                      ) : (
                        'Verify Code'
                      )}
                    </button>
                  </form>

                  {/* Action buttons */}
                  <div className="d-flex flex-column gap-2">
                    <button
                      onClick={handleReset}
                      disabled={isNavigating}
                      className="btn btn-outline-secondary"
                    >
                      Try Different Email
                    </button>
                    
                    <button
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading || isNavigating}
                      className="btn btn-outline-primary"
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                      ) : isNavigating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Redirecting...
                        </>
                      ) : (
                        'Resend Code'
                      )}
                    </button>
                  </div>

                  {/* Help text */}
                  <div className="text-center mt-4">
                    <p className="text-muted small mb-0">
                      Didn&apos;t receive the code? Check your spam folder or try resending.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-sm rounded-xl">
              <div className="card-body p-4">
                {/* Page header */}
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <i className="bi bi-shield-lock text-primary" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <h1 className="h4 fw-bold mb-2">
                    Login
                  </h1>
                  <p className="text-muted mb-0">
                    Enter your email to receive a verification code
                  </p>
                </div>

                {/* OTP form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-semibold">
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
                      className="form-control"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-100 mb-3"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending Code...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>

                {/* Status message display */}
                {status && (
                  <div className={`alert ${status.includes('Error') ? 'alert-danger' : 'alert-success'} mb-3`}>
                    {status}
                  </div>
                )}

                {/* Additional information */}
                <div className="text-center">
                  <p className="text-muted small mb-0">
                    Enter the 6-digit code from your email to sign in. No password required!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
