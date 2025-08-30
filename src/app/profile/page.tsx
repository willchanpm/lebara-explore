import AuthStatus from "@/components/AuthStatus";

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
        
        {/* Placeholder content */}
        <div className="profile-placeholder">
          <div className="profile-icon-placeholder">
            <span className="profile-icon-emoji">👤</span>
          </div>
          <h3 className="profile-feature-title">Profile Feature</h3>
          <p className="profile-feature-text">This feature is under development</p>
          
          {/* Coming soon card */}
          <div className="profile-coming-soon">
            <h4 className="coming-soon-title">⚙️ Personal Settings</h4>
            <p className="coming-soon-text">
              Customize your profile, manage preferences, and control your privacy settings 
              in one convenient place!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
