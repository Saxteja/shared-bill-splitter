// src/components/common/ErrorState.tsx
/** UI shown when an API request fails. */
export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-state" style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#b00' }} role="alert">
        Error: {message}
      </p>
      <button type="button" className="primary-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
