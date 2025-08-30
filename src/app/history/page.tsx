export default function HistoryPage() {
  return (
    <div className="history-page">
      <div className="history-container">
        {/* Header */}
        <div className="history-header">
          <h1 className="history-title">History</h1>
          <p className="history-subtitle">Track your past activities</p>
        </div>
        
        {/* Placeholder content */}
        <div className="history-placeholder">
          <div className="history-icon-placeholder">
            <span className="history-icon-emoji">🕰️</span>
          </div>
          <h3 className="history-feature-title">History Feature</h3>
          <p className="history-feature-text">This feature is under development</p>
          
          {/* Coming soon card */}
          <div className="history-coming-soon">
            <h4 className="history-coming-soon-title">📊 Activity Timeline</h4>
            <p className="history-coming-soon-text">
              Soon you&apos;ll be able to view your complete journey - places visited, 
              games played, and memories created!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
