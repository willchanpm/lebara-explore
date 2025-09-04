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
    // Fixed bottom navigation bar with Bootstrap 5 styling
    <nav className="navbar fixed-bottom bg-light border-top" role="navigation" aria-label="Bottom navigation">
      {/* Navigation items container with Bootstrap flex utilities */}
      <div className="container-fluid d-flex justify-content-around">
        {navItems.map((item) => {
          // Check if this tab is currently active
          const isActive = pathname === item.path
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link d-flex flex-column align-items-center small py-2 ${isActive ? 'active fw-bold text-primary' : 'text-muted'}`}
              aria-label={item.label}
              title={item.label}
            >
              {/* Active state wrapper with square highlight */}
              {isActive ? (
                <div className="bg-primary-subtle px-2 py-1 d-flex flex-column align-items-center">
                  {/* Emoji icon - larger size for better visibility */}
                  <span className="nav-icon" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  
                  {/* Tab label - smaller text to fit in the compact design */}
                  <span className="nav-label">
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  {/* Emoji icon - larger size for better visibility */}
                  <span className="nav-icon" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  
                  {/* Tab label - smaller text to fit in the compact design */}
                  <span className="nav-label">
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
