import Feed from '@/components/Feed'

export default function FeedPage() {
  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Header */}
        <div className="feed-header">
          <h1 className="feed-title">Feed</h1>
          <p className="feed-subtitle">Stay updated with the latest</p>
        </div>
        
        {/* Feed component */}
        <Feed />
      </div>
    </div>
  )
}
