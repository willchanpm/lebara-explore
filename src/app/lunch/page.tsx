export default function LunchPage() {
  return (
    <div className="lunch-page">
      {/* Main content container */}
      <main className="lunch-container">
        {/* Page title and subtitle */}
        <div className="lunch-header">
          <h1 className="lunch-title">
            What&apos;s for lunch?
          </h1>
          <p className="lunch-subtitle">
            Spin the wheel or ask the AI to pick a nearby spot.
          </p>
        </div>

        {/* Lunch option cards - stacked vertically with spacing */}
        <div className="lunch-cards">
          {/* Roulette Card */}
          <div className="card-compact">
            <div className="lunch-card-header">
              <div className="lunch-card-title-section">
                <div className="lunch-card-emoji">🎲</div>
                <h3 className="lunch-card-title">Roulette</h3>
              </div>
              <a 
                href="/lunch/roulette" 
                className="btn btn-primary lunch-card-button"
              >
                Open
              </a>
            </div>
            <p className="lunch-card-subtitle">Random pick with simple filters.</p>
          </div>

          {/* AI Card */}
          <div className="card-compact">
            <div className="lunch-card-header">
              <div className="lunch-card-title-section">
                <div className="lunch-card-emoji">✨</div>
                <h3 className="lunch-card-title">Ask the AI</h3>
              </div>
              <a 
                href="/lunch/ai" 
                className="btn btn-primary lunch-card-button"
              >
                Open
              </a>
            </div>
            <p className="lunch-card-subtitle">Describe your mood and preferences.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
