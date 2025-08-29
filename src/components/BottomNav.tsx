'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Define the navigation items with their paths, labels, and emoji icons
const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/places', label: 'Places', icon: '☕' },
  { path: '/bingo', label: 'Bingo', icon: '🎯' },
  { path: '/feed', label: 'Feed', icon: '🖼️' },
  { path: '/history', label: 'History', icon: '🕰️' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  // Get the current pathname to determine which tab is active
  const pathname = usePathname()

  return (
    // Fixed bottom navigation bar with safe area padding for mobile devices
    // Using brand-navy background with slight translucency in dark mode
    <nav className="
      fixed bottom-0 left-0 right-0 z-50
      pb-safe pt-2
      shadow-lg
      bg-brand-navy
      opacity-95
    ">
      {/* Navigation items container */}
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          // Check if this tab is currently active
          const isActive = pathname === item.path
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex flex-col items-center justify-center
                w-16 h-16 rounded-xl
                transition-all duration-200
                hover:scale-105 active:scale-95
                ${isActive 
                  ? 'bg-brand text-white' 
                  : 'bg-card text-muted border border-white/8'
                }
              `}
              aria-label={item.label}
              title={item.label}
            >
              {/* Emoji icon - larger size for better visibility */}
              <span className="text-2xl mb-1" role="img" aria-hidden="true">
                {item.icon}
              </span>
              
              {/* Tab label - smaller text to fit in the compact design */}
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
