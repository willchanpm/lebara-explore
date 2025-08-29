import Image from "next/image";
import AuthStatus from "@/components/AuthStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text p-6">
      {/* Header section with app title and auth status */}
      <div className="max-w-4xl mx-auto mb-8">
        <AuthStatus />
      </div>
      
      {/* Main hero section */}
      <main className="max-w-4xl mx-auto space-y-8">
        {/* App title and description */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy">
            Welcome to Liverpool St Explorer! 🎉
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Start your journey by exploring places, playing games, and creating memories. 
            The world is waiting for you to discover it!
          </p>
        </div>

        {/* Feature cards grid - inspired by Lebara design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Places Card */}
          <div className="card">
            <div className="text-4xl mb-4">☕</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Places</h3>
            <p className="text-muted mb-4">Discover and explore amazing locations around you</p>
            <a 
              href="/places" 
              className="btn btn-primary"
            >
              Explore Places
            </a>
          </div>

          {/* Bingo Card */}
          <div className="card">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Bingo</h3>
            <p className="text-muted mb-4">Play fun bingo games and challenge yourself</p>
            <a 
              href="/bingo" 
              className="btn btn-primary"
            >
              Play Bingo
            </a>
          </div>

          {/* Feed Card */}
          <div className="card">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Feed</h3>
            <p className="text-muted mb-4">Browse through beautiful photos and stories</p>
            <a 
              href="/feed" 
              className="btn btn-primary"
            >
              View Feed
            </a>
          </div>

          {/* History Card */}
          <div className="card">
            <div className="text-4xl mb-4">🕰️</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">History</h3>
            <p className="text-muted mb-4">Track your journey and revisit memories</p>
            <a 
              href="/history" 
              className="btn btn-primary"
            >
              View History
            </a>
          </div>

          {/* Profile Card */}
          <div className="card">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Profile</h3>
            <p className="text-muted mb-4">Manage your account and preferences</p>
            <a 
              href="/profile" 
              className="btn btn-primary"
            >
              View Profile
            </a>
          </div>

          {/* Account Card */}
          <div className="card">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-brand-navy mb-2">Account</h3>
            <p className="text-muted mb-4">Access your account settings and security</p>
            <a 
              href="/account" 
              className="btn btn-primary"
            >
              Manage Account
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
