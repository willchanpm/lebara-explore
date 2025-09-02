import { createSupabaseServer } from '@/lib/supabase/server'
import { signOutAction } from '@/app/actions'

export default async function AuthStatus() {
  // Fetch user data on the server
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user email for display
  const userEmail = user?.email || null
  
  // Show signed in state with user email and sign out form
  if (userEmail) {
    return (
      <div className="auth-status-signed-in">
        <div className="auth-status-content">
          <div className="auth-status-info">
            <div className="status-dot success"></div>
            <p className="auth-status-text">
              Signed in as <span className="auth-status-email">{userEmail}</span>
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn btn-primary auth-signout-button"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Show not signed in state
  return (
    <div className="card-small">
      <div className="auth-status-not-signed">
        <div className="auth-status-info">
          <div className="status-dot inactive"></div>
          <p className="auth-status-text">Not signed in</p>
        </div>
        <a 
          href="/login" 
          className="btn btn-primary auth-signin-button"
        >
          Sign in
        </a>
      </div>
    </div>
  )
}
