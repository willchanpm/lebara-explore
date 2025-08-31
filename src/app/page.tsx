import Link from 'next/link'; // Import Next.js Link component for client-side navigation
import AndroidInstallBanner from '@/components/AndroidInstallBanner'; // Import the Android install banner
import IOSInstallBanner from '@/components/IOSInstallBanner'; // Import the iOS install banner

export default function Home() {
  return (
    <div className="home-page">
      {/* Main hero section */}
      <main className="home-container">
        {/* Install Banners - only show on respective platforms */}
        <AndroidInstallBanner />
        <IOSInstallBanner />
        
        {/* App title and description */}
        <div className="home-hero">
          <h1 className="home-title">
            Welcome to Liverpool St Explorer! 🎉
          </h1>
          <p className="home-subtitle">
          Explore. Play. Discover. Your Liverpool Street adventure starts here.
          </p>
        </div>

        {/* Feature cards grid - inspired by Lebara design */}
        <div className="home-cards-grid">
          {/* Discover Card */}
          <Link href="/discover" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🗺️</div>
                <h3 className="home-card-title">Discover</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">Browse places around Liverpool Street</p>
          </Link>

          {/* What's for lunch? Card */}
          <Link href="/hungry" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🍽️</div>
                <h3 className="home-card-title">What&apos;s for lunch?</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">Spin the wheel or ask the AI</p>
          </Link>

          {/* Bingo Card */}
          <Link href="/bingo" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🎯</div>
                <h3 className="home-card-title">Bingo</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">Play the monthly challenge</p>
          </Link>

          {/* Social / Feed Card */}
          <Link href="/social" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">👥</div>
                <h3 className="home-card-title">Social / Feed</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">See what others are up to</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
