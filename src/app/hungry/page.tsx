import Link from 'next/link'; // Import Next.js Link component for client-side navigation

export default function HungryPage() {
  return (
    <div className="hungry-page">
      {/* Main content container */}
      <main className="hungry-container">
        {/* Page title and intro */}
        <div className="hungry-header">
          <h1 className="hungry-title">
            What&apos;s for lunch?
          </h1>
          <p className="hungry-subtitle">
            Spin the wheel or ask the AI to pick a nearby spot.
          </p>
        </div>

        {/* Launcher cards grid - using the same style as home page */}
        <div className="home-cards-grid">
          {/* Lunch Roulette Card */}
          <Link href="/hungry/roulette" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🎲</div>
                <h3 className="home-card-title">Lunch Roulette</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">Random pick with simple filters.</p>
          </Link>

          {/* Ask the AI Card */}
          <Link href="/hungry/ai" className="card-compact home-card-link">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🤖</div>
                <h3 className="home-card-title">Ask the AI</h3>
              </div>
              <div className="home-card-chevron">›</div>
            </div>
            <p className="home-card-subtitle">Describe your mood and constraints.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
