// src/components/common/LoadingState.tsx
import React from 'react'

/** Simple loading UI used across the app */
export default function LoadingState() {
  return (
    <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
      Loading…
    </div>
  )
}
