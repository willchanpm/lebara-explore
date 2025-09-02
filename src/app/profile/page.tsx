import { createSupabaseServer } from '@/lib/supabase/server'
import ProfilePageClient from './ProfilePageClient'
import AuthStatus from "@/components/AuthStatus"

export default async function ProfilePage() {
  // Fetch user data on the server using the correct server-side method
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Pass minimal user data to client component
  const userEmail = session?.user?.email || null
  
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
        
        {/* Profile Page Client Component */}
        <ProfilePageClient userEmail={userEmail} />
      </div>
    </div>
  )
}
