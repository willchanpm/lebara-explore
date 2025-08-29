export default function HistoryPage() {
  return (
    <div className="min-h-screen pb-24 bg-bg">
      <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-2 text-brand-navy">History</h1>
          <p className="text-sm font-medium text-muted">Track your past activities</p>
        </div>
        
        {/* Placeholder content */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-lebara-lg flex items-center justify-center mb-6 bg-card border-2 border-border shadow-lebara">
            <span className="text-3xl">🕰️</span>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-brand-navy">History Feature</h3>
          <p className="text-base text-muted">This feature is under development</p>
          
          {/* Coming soon card */}
          <div className="mt-8 gradient-brand rounded-lebara-lg p-6 shadow-lebara border border-border max-w-md">
            <h4 className="text-lg font-bold text-brand-navy mb-2">📊 Activity Timeline</h4>
            <p className="text-brand-navy/80 text-sm">
              Soon you&apos;ll be able to view your complete journey - places visited, 
              games played, and memories created!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
