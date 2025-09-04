'use client'

import Link from 'next/link'

export default function ProfileIcon() {
  return (
    <div className="position-fixed" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "12px", zIndex: 1080 }}>
      <Link 
        href="/profile" 
        className="btn btn-light rounded-circle shadow-sm border text-decoration-none d-flex align-items-center justify-content-center"
        style={{ width: 48, height: 48 }}
        aria-label="My account"
        title="My account"
      >
        <span className="profile-icon-emoji" role="img" aria-hidden="true">
          👤
        </span>
        {/* Optional badge hook for future notifications */}
        {/* <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">1</span> */}
      </Link>
    </div>
  )
}
