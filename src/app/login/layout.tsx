'use client'

import { useEffect } from 'react'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Add class to body when login layout mounts
    document.body.classList.add('login-page-active')
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('login-page-active')
    }
  }, [])

  return (
    <div className="login-layout">
      {children}
    </div>
  )
}
