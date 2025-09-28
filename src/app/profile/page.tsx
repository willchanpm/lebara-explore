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
    <div className="container py-4 pb-5">
      {/* Header - matches other pages */}
      <div className="profile-header">
        <h1 className="display-5 fw-bold text-center mb-2">Profile</h1>
        <p className="lead text-center text-muted mb-4">Manage your account and preferences</p>
      </div>
      
      {/* Authentication Status - using Bootstrap card */}
      <div className="mb-4">
        <AuthStatus />
      </div>
      
      {/* Profile Editor - using Bootstrap card */}
      <div className="mb-4">
        <ProfileEditor />
      </div>
      
      {/* Favorites Section - using Bootstrap card */}
      <div className="mb-4">
        <Favorites currentUser={currentUser} />
      </div>
    </div>
  )
}
