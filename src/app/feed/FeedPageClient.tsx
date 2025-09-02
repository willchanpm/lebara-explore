'use client'

import Feed from '@/components/Feed'

interface FeedPageClientProps {
  userEmail: string | null // User email from server-side props
}

export default function FeedPageClient({ userEmail }: FeedPageClientProps) {
  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Header */}
        <div className="feed-header">
          <h1 className="feed-title">Feed</h1>
          <p className="feed-subtitle">Stay updated with the latest</p>
        </div>
        
        {/* Feed component */}
        <Feed userEmail={userEmail} />
      </div>
    </div>
  )
}
