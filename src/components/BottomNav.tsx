'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Define the navigation items with their paths, labels, and emoji icons
const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/discover', label: 'Discover', icon: '🔍' },
  { path: '/hungry', label: 'Hungry?', icon: '🍽️' },
  { path: '/bingo', label: 'Bingo', icon: '🎯' },
  { path: '/feed', label: 'Feed', icon: '🖼️' },
]

export default function BottomNav() {
  // Get the current pathname to determine which tab is active
  const pathname = usePathname()

  return (
    // Fixed bottom navigation bar with safe area padding for mobile devices
    // Using the new Lebara-inspired design with light blue background and dark blue accents
    <nav className="bottom-nav">
      {/* Navigation items container */}
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          // Check if this tab is currently active
          const isActive = pathname === item.path
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              title={item.label}
            >
              {/* Emoji icon - larger size for better visibility */}
              <span className="nav-icon" role="img" aria-hidden="true">
                {item.icon}
              </span>
              
              {/* Tab label - smaller text to fit in the compact design */}
              <span className="nav-label">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
