// src/components/common/ErrorState.tsx
import React from 'react'

/** UI shown when an API request fails. */
export default function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="error-state" style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#b00' }}>Error: {message}</p>
      <button className="primary-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
