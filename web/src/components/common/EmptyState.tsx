// src/components/common/EmptyState.tsx
/** Shown when there is no data or when a required parameter is missing */
export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }} role="status">
      <p>{message}</p>
    </div>
  )
}
