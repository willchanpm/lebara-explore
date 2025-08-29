'use client'

import Link from 'next/link'

export default function ProfileIcon() {
  return (
    <div className="profile-icon-container">
      <Link 
        href="/profile" 
        className="profile-icon"
        aria-label="Profile"
        title="Profile"
      >
        <span className="profile-icon-emoji" role="img" aria-hidden="true">
          👤
        </span>
      </Link>
    </div>
  )
}
