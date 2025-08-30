'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import AuthStatus from "@/components/AuthStatus";
import ProfileEditor from "@/components/ProfileEditor";
import Favorites from "@/components/Favorites";

export default function ProfilePage() {
  // State for current user
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error fetching user:', error)
        } else {
          setCurrentUser(user)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      }
    }
    
    getCurrentUser()
  }, [])

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account</p>
        </div>
        
        {/* Authentication Status */}
        <div className="profile-auth-section">
          <AuthStatus />
        </div>
        
        {/* Profile Editor */}
        <div className="profile-editor-section">
          <ProfileEditor />
        </div>
        
        {/* Favorites Section */}
        <div className="profile-favorites-section">
          <Favorites currentUser={currentUser} />
        </div>
      </div>
    </div>
  )
}
