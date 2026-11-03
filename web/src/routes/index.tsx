import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import { useHomes } from '../hooks/useHomes'

export const Route = createFileRoute('/')({
  component: HouseholdSelectionPage,
})

function HouseholdSelectionPage() {
  const navigate = useNavigate()
  const { homes, isLoading, error, reload } = useHomes()

  return (
    <main className="household-app">
      <header className="household-topbar">
        <Link to="/" className="household-brand" aria-label="Duesly home">
          DUESLY
        </Link>
        <span className="household-topbar-label">Shared Bill Splitter</span>
      </header>

      <section className="household-content" aria-labelledby="household-heading">
        <p className="household-eyebrow">YOUR HOUSEHOLDS</p>
        <h1 id="household-heading">Where are we splitting?</h1>
        <p className="household-intro">Choose a household to open its shared expense ledger.</p>

        {isLoading && <LoadingState />}
        {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
        {!isLoading && !error && homes.length === 0 && (
          <EmptyState message="There are no households yet. Once a household is available, it will appear here." />
        )}
        {!isLoading && !error && homes.length > 0 && (
          <ul className="household-list" aria-label="Available households">
            {homes.map((home) => (
              <li key={home.id}>
                <button
                  className="household-card"
                  type="button"
                  onClick={() => void navigate({ to: '/split', search: { homeId: home.id } })}
                >
                  <span className="household-card-icon" aria-hidden="true">
                    {home.name.trim().charAt(0).toUpperCase() || '⌂'}
                  </span>
                  <span className="household-card-name">{home.name}</span>
                  <span className="household-card-action" aria-hidden="true">
                    Open ledger <span>→</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
