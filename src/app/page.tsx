import AuthStatus from "@/components/AuthStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text p-6 pb-32">
      {/* Header section with app title and auth status */}
      <div className="max-w-4xl mx-auto mb-6">
        <AuthStatus />
      </div>
      
      {/* Main hero section */}
      <main className="max-w-4xl mx-auto space-y-6">
        {/* App title and description */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy">
            Welcome to Liverpool St Explorer! 🎉
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Start your journey by exploring places, playing games, and creating memories. 
            The world is waiting for you to discover it!
          </p>
        </div>

        {/* Feature cards grid - inspired by Lebara design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {/* Places Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">☕</div>
                <h3 className="text-lg font-bold text-brand-navy">Places</h3>
              </div>
              <a 
                href="/places" 
                className="btn btn-primary"
              >
                Explore Places
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Discover and explore amazing locations around you</p>
          </div>

          {/* Bingo Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🎯</div>
                <h3 className="text-lg font-bold text-brand-navy">Bingo</h3>
              </div>
              <a 
                href="/bingo" 
                className="btn btn-primary"
              >
                Play Bingo
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Play fun bingo games and challenge yourself</p>
          </div>

          {/* Feed Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🖼️</div>
                <h3 className="text-lg font-bold text-brand-navy">Feed</h3>
              </div>
              <a 
                href="/feed" 
                className="btn btn-primary"
              >
                View Feed
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Browse through beautiful photos and stories</p>
          </div>

          {/* History Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🕰️</div>
                <h3 className="text-lg font-bold text-brand-navy">History</h3>
              </div>
              <a 
                href="/history" 
                className="btn btn-primary"
              >
                View History
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Track your journey and revisit memories</p>
          </div>

          {/* Profile Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">👤</div>
                <h3 className="text-lg font-bold text-brand-navy">Profile</h3>
              </div>
              <a 
                href="/profile" 
                className="btn btn-primary"
              >
                View Profile
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Manage your account and preferences</p>
          </div>

          {/* Account Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🔐</div>
                <h3 className="text-lg font-bold text-brand-navy">Account</h3>
              </div>
              <a 
                href="/account" 
                className="btn btn-primary"
              >
                Manage Account
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Access your account settings and security</p>
          </div>
        </div>
      </main>
    </div>
  );
}
