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
    <nav className="navbar fixed-bottom bg-white border-top shadow-sm p-0 w-100" role="navigation" aria-label="Bottom navigation" style={{ zIndex: 1030, height: "64px", ["--bottom-nav-h" as any]: "64px" }}>
      <div className="container-fluid p-0">
        <ul className="nav nav-justified w-100 mb-0">
          {navItems.map((item) => {
            // Check if this tab is currently active
            const isActive = pathname === item.path
            
            return (
              <li key={item.path} className="nav-item flex-fill">
                <Link
                  href={item.path}
                  className={`nav-link d-flex flex-column align-items-center justify-content-center text-decoration-none small h-100 gap-1 text-nowrap py-1 px-0 ${isActive ? 'fw-bold text-white' : 'text-muted'}`}
                  style={isActive ? { backgroundColor: "rgba(255, 49, 130, 0.85)" } : {}}
                  aria-label={item.label}
                  title={item.label}
                >
                  {/* Emoji icon - larger size for better visibility */}
                  <span className={`nav-icon ${isActive ? 'text-white' : ''}`} role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  
                  {/* Tab label - smaller text to fit in the compact design */}
                  <span className="nav-label text-nowrap" style={{ fontSize: "0.75rem" }}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
