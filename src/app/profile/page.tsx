import AuthStatus from "@/components/AuthStatus";
import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
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
      </div>
    </div>
  )
}
