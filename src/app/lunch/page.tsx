export default function LunchPage() {
  return (
    <div className="min-h-screen bg-bg text-text p-6 pb-32">
      {/* Main content container */}
      <main className="max-w-4xl mx-auto space-y-6">
        {/* Page title and subtitle */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy">
            What's for lunch?
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Spin the wheel or ask the AI to pick a nearby spot.
          </p>
        </div>

        {/* Lunch option cards - stacked vertically with spacing */}
        <div className="space-y-6 mt-8">
          {/* Roulette Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🎲</div>
                <h3 className="text-lg font-bold text-brand-navy">Roulette</h3>
              </div>
              <a 
                href="/lunch/roulette" 
                className="btn btn-primary text-sm py-2 px-3"
              >
                Open
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Random pick with simple filters.</p>
          </div>

          {/* AI Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">✨</div>
                <h3 className="text-lg font-bold text-brand-navy">Ask the AI</h3>
              </div>
              <a 
                href="/lunch/ai" 
                className="btn btn-primary text-sm py-2 px-3"
              >
                Open
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Describe your mood and preferences.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
