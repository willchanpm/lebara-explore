export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text p-6 pb-32">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Discover Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🗺️</div>
                <h3 className="text-lg font-bold text-brand-navy">Discover</h3>
              </div>
              <a 
                href="/discover" 
                className="btn btn-primary text-sm py-2 px-3"
                aria-label="Browse places around Liverpool Street"
              >
                Explore
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Browse places around Liverpool Street</p>
          </div>

          {/* What's for lunch? Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🍽️</div>
                <h3 className="text-lg font-bold text-brand-navy">What&apos;s for lunch?</h3>
              </div>
              <a 
                href="/hungry" 
                className="btn btn-primary text-sm py-2 px-3"
                aria-label="Spin the wheel or ask the AI for lunch options"
              >
                Find Food
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Spin the wheel or ask the AI</p>
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
                className="btn btn-primary text-sm py-2 px-3"
                aria-label="Play the monthly bingo challenge"
              >
                Play
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">Play the monthly challenge</p>
          </div>

          {/* Social / Feed Card */}
          <div className="card-compact">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <div className="text-3xl mr-3">👥</div>
                <h3 className="text-lg font-bold text-brand-navy">Social / Feed</h3>
              </div>
              <a 
                href="/social" 
                className="btn btn-primary text-sm py-2 px-3"
                aria-label="See posts and track your history"
              >
                View
              </a>
            </div>
            <p className="text-muted mb-3 text-sm">See posts and track your history</p>
          </div>
        </div>
      </main>
    </div>
  );
}
