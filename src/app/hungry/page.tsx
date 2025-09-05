import Link from 'next/link'; // Import Next.js Link component for client-side navigation

export default function HungryPage() {
  return (
    <div className="container py-4 pb-5">
      {/* Hero section with Bootstrap typography classes */}
      <h1 className="display-5 fw-bold text-center mb-2">What&apos;s for lunch?</h1>
      <p className="lead text-center text-muted mb-4">Spin the wheel or ask the AI to pick a nearby spot.</p>

      {/* Cards section - vertical stack with Bootstrap card components */}
      {/* Lunch Roulette Card - full-width tap target with Bootstrap styling */}
      <div className="card shadow-sm rounded-4 mb-3 position-relative">
        <Link href="/hungry/roulette" className="stretched-link text-decoration-none" />
        <div className="card-body d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-start gap-3">
            {/* Icon container with Bootstrap styling */}
            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
              <span aria-hidden>🎲</span>
            </div>
            <div>
              {/* Card title and description with Bootstrap typography */}
              <div className="fw-bold h5 mb-1">Lunch Roulette</div>
              <div className="text-muted">Random pick with simple filters.</div>
            </div>
          </div>
          {/* Chevron icon using Bootstrap Icons */}
          <i className="bi bi-chevron-right text-muted fs-5 ms-3" aria-hidden="true"></i>
        </div>
      </div>

      {/* Ask AI Card - full-width tap target with Bootstrap styling */}
      <div className="card shadow-sm rounded-4 mb-3 position-relative">
        <Link href="/hungry/ai" className="stretched-link text-decoration-none" />
        <div className="card-body d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-start gap-3">
            {/* Icon container with Bootstrap styling */}
            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
              <span aria-hidden>🤖</span>
            </div>
            <div>
              {/* Card title and description with Bootstrap typography */}
              <div className="fw-bold h5 mb-1">Ask AI</div>
              <div className="text-muted">Describe your mood and let the AI pick a spot.</div>
            </div>
          </div>
          {/* Chevron icon using Bootstrap Icons */}
          <i className="bi bi-chevron-right text-muted fs-5 ms-3" aria-hidden="true"></i>
        </div>
      </div>
    </div>
  );
}
