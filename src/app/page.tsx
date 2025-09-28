import Link from 'next/link'; // Import Next.js Link component for client-side navigation
import AndroidInstallBanner from '@/components/AndroidInstallBanner'; // Import the Android install banner
import IOSInstallBanner from '@/components/IOSInstallBanner'; // Import the iOS install banner

export default function Home() {
  return (
    <div className="container py-3 pb-4">
      {/* Install Banners - only show on respective platforms */}
      <div className="row">
        <div className="col-12">
          <AndroidInstallBanner />
          <IOSInstallBanner />
        </div>
      </div>
      
      {/* App title and description */}
      <div className="row mb-3">
        <div className="col-12 text-center">
          <h1 className="display-5 mb-2">
            Welcome to Liverpool St Explorer! 🎉
          </h1>
          <p className="lead mb-0" style={{ fontSize: '1.1rem' }}>
            Explore. Play. Discover. Your Liverpool Street adventure starts here.
          </p>
        </div>
      </div>

      {/* Feature cards grid - Horizontal rectangles */}
      <div className="row g-2">
        {/* Discover Card */}
        <div className="col-12 col-md-6 col-lg-3 mb-2">
          <Link href="/discover" className="text-decoration-none">
            <div className="card shadow-sm horizontal-card">
              <div className="card-body d-flex align-items-center" style={{ padding: '0.75rem 1rem' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle me-2" style={{ width: 36, height: 36 }}>
                  🗺️
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title fw-bold mb-1" style={{ fontSize: '0.95rem' }}>Discover</h5>
                  <p className="card-text text-muted mb-0 small">Browse places around Liverpool Street</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* What's for lunch? Card */}
        <div className="col-12 col-md-6 col-lg-3 mb-2">
          <Link href="/hungry" className="text-decoration-none">
            <div className="card shadow-sm horizontal-card">
              <div className="card-body d-flex align-items-center" style={{ padding: '0.75rem 1rem' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle me-2" style={{ width: 36, height: 36 }}>
                  🍽️
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title fw-bold mb-1" style={{ fontSize: '0.95rem' }}>What&apos;s for lunch?</h5>
                  <p className="card-text text-muted mb-0 small">Spin the wheel or ask the AI</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Bingo Card */}
        <div className="col-12 col-md-6 col-lg-3 mb-2">
          <Link href="/bingo" className="text-decoration-none">
            <div className="card shadow-sm horizontal-card">
              <div className="card-body d-flex align-items-center" style={{ padding: '0.75rem 1rem' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle me-2" style={{ width: 36, height: 36 }}>
                  🎯
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title fw-bold mb-1" style={{ fontSize: '0.95rem' }}>Bingo</h5>
                  <p className="card-text text-muted mb-0 small">Play the monthly challenge</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Social / Feed Card */}
        <div className="col-12 col-md-6 col-lg-3 mb-2">
          <Link href="/social" className="text-decoration-none">
            <div className="card shadow-sm horizontal-card">
              <div className="card-body d-flex align-items-center" style={{ padding: '0.75rem 1rem' }}>
                <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle me-2" style={{ width: 36, height: 36 }}>
                  👥
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title fw-bold mb-1" style={{ fontSize: '0.95rem' }}>Social / Feed</h5>
                  <p className="card-text text-muted mb-0 small">See what others are up to</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
