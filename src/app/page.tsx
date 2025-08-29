export default function Home() {
  return (
    <div className="home-page">
      {/* Main hero section */}
      <main className="home-container">
        {/* App title and description */}
        <div className="home-hero">
          <h1 className="home-title">
            Welcome to Liverpool St Explorer! 🎉
          </h1>
          <p className="home-subtitle">
            Start your journey by exploring places, playing games, and creating memories. 
            The world is waiting for you to discover it!
          </p>
        </div>

        {/* Feature cards grid - inspired by Lebara design */}
        <div className="home-cards-grid">
          {/* Discover Card */}
          <div className="card-compact">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🗺️</div>
                <h3 className="home-card-title">Discover</h3>
              </div>
              <a 
                href="/discover" 
                className="btn btn-primary"
                aria-label="Browse places around Liverpool Street"
              >
                Explore
              </a>
            </div>
            <p className="home-card-subtitle">Browse places around Liverpool Street</p>
          </div>

          {/* What's for lunch? Card */}
          <div className="card-compact">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🍽️</div>
                <h3 className="home-card-title">What&apos;s for lunch?</h3>
              </div>
              <a 
                href="/hungry" 
                className="btn btn-primary"
                aria-label="Spin the wheel or ask the AI for lunch options"
              >
                Find Food
              </a>
            </div>
            <p className="home-card-subtitle">Spin the wheel or ask the AI</p>
          </div>

          {/* Bingo Card */}
          <div className="card-compact">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">🎯</div>
                <h3 className="home-card-title">Bingo</h3>
              </div>
              <a 
                href="/bingo" 
                className="btn btn-primary"
                aria-label="Play the monthly bingo challenge"
              >
                Play
              </a>
            </div>
            <p className="home-card-subtitle">Play the monthly challenge</p>
          </div>

          {/* Social / Feed Card */}
          <div className="card-compact">
            <div className="home-card-header">
              <div className="home-card-title-section">
                <div className="home-card-emoji">👥</div>
                <h3 className="home-card-title">Social / Feed</h3>
              </div>
              <a 
                href="/social" 
                className="btn btn-primary"
                aria-label="See posts and track your history"
              >
                View
              </a>
            </div>
            <p className="home-card-subtitle">See posts and track your history</p>
          </div>
        </div>
      </main>
    </div>
  );
}
