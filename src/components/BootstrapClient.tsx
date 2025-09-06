'use client'

import { useEffect } from 'react'

// This component doesn't render anything, it just loads Bootstrap JS
export default function BootstrapClient() {
  useEffect(() => {
    // Only import Bootstrap JS on the client side
    if (typeof window !== 'undefined') {
      import('bootstrap/dist/js/bootstrap.bundle.min.js').catch(() => {
        // Ignore import errors
      })
    }
  }, [])

  return null
}
