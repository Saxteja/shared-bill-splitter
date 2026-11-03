// src/components/common/LoadingState.tsx
/** Simple loading UI used across the app */
export default function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      Loading…
    </div>
  )
}
