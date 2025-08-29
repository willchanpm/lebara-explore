export default function HungryPage() {
  return (
    <div className="min-h-screen bg-bg text-text p-6 pb-32">
      {/* Main content container */}
      <main className="max-w-4xl mx-auto space-y-6">
        {/* Page title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-navy">
            Hungry?
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Find the perfect place to satisfy your hunger.
          </p>
        </div>

        {/* Placeholder content */}
        <div className="text-center mt-8">
          <p className="text-muted">
            Hungry page coming soon...
          </p>
        </div>
      </main>
    </div>
  );
}
