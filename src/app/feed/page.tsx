import Feed from '@/components/Feed'

export default function FeedPage() {
  return (
    <div className="container py-4 pb-5">
      {/* Header */}
      <div className="feed-header">
        <h1 className="display-5 fw-bold text-center mb-2">Feed</h1>
        <p className="lead text-center text-muted mb-4">Stay updated with the latest</p>
      </div>
      
      {/* Feed component */}
      <Feed />
    </div>
  )
}
