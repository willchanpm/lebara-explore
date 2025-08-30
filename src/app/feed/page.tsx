export default function FeedPage() {
  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Header */}
        <div className="feed-header">
          <h1 className="feed-title">Feed</h1>
          <p className="feed-subtitle">Stay updated with the latest</p>
        </div>
        
        {/* Placeholder content */}
        <div className="feed-placeholder">
          <div className="feed-icon-placeholder">
            <span className="feed-icon-emoji">🖼️</span>
          </div>
          <h3 className="feed-feature-title">Feed Feature</h3>
          <p className="feed-feature-text">This feature is under development</p>
          
          {/* Coming soon card */}
          <div className="feed-coming-soon">
            <h4 className="feed-coming-soon-title">📱 Social Feed</h4>
            <p className="feed-coming-soon-text">
              Get ready for a beautiful social feed where you can share and discover 
              amazing moments with the community!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
