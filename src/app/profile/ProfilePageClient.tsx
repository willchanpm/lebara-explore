'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import ProfileEditor from "@/components/ProfileEditor";
import Favorites from "@/components/Favorites";

interface ProfilePageClientProps {
  userEmail: string | null // User email from server-side props
}

export default function ProfilePageClient({ userEmail }: ProfilePageClientProps) {
  // State for current user (derived from userEmail prop)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Set current user from userEmail prop
  useEffect(() => {
    if (userEmail) {
      // Create a minimal user object with the email
      setCurrentUser({ id: '', email: userEmail } as User)
    } else {
      setCurrentUser(null)
    }
  }, [userEmail])

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Editor */}
        <div className="profile-editor-section">
          <ProfileEditor userEmail={userEmail} />
        </div>
        
        {/* Favorites Section */}
        <div className="profile-favorites-section">
          <Favorites currentUser={currentUser} />
        </div>
      </div>
    </div>
  )
}
