'use client'

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import ProfileIcon from './ProfileIcon'

export default function ConditionalNav() {
  const pathname = usePathname()
  
  // Don't show navigation on login and auth pages
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    return null
  }
  
  return (
    <>
      <ProfileIcon />
      <BottomNav />
    </>
  )
}

// Helper function to check if page should have bottom padding
export function shouldHaveBottomPadding(pathname: string) {
  return !(pathname === '/login' || pathname.startsWith('/auth/'))
}
