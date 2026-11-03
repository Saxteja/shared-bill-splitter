import { Link, useNavigate } from '@tanstack/react-router'
import { useHomes } from '../../hooks/useHomes'
import MemberSelector from '../members/MemberSelector'

/** Header for the functional /split route */
export default function Header({ homeId }: { homeId: string }) {
  const navigate = useNavigate({ from: '/split' })
  const { homes, isLoading, error } = useHomes()
  const selectedHomeExists = homes.some((home) => home.id === homeId)
  const canSwitchHomes = !isLoading && !error && homes.length > 0

  return (
    <header className="topbar">
      <Link to="/split" search={{ homeId }} className="brand">
        SPLIT LEDGER
      </Link>
      <div className="header-actions">
        <label className="home-selector-label">
          <span className="visually-hidden">Select household</span>
          <select
            className="home-selector"
            aria-label="Select household"
            aria-describedby={error ? 'household-selector-error' : undefined}
            value={homeId}
            disabled={!canSwitchHomes}
            onChange={(event) => {
              const nextHomeId = event.currentTarget.value
              if (nextHomeId && nextHomeId !== homeId) {
                void navigate({ to: '/split', search: { homeId: nextHomeId } })
              }
            }}
          >
            {!selectedHomeExists && (
              <option value={homeId}>
                {isLoading ? 'Loading households…' : 'Selected household unavailable'}
              </option>
            )}
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
          {error && (
            <span
              id="household-selector-error"
              className="household-selector-message"
              role="status"
            >
              Could not load households: {error}
            </span>
          )}
          {!isLoading && !error && homes.length === 0 && (
            <span className="household-selector-message" role="status">
              No households are available.
            </span>
          )}
        </label>
        <span className="header-divider" />
        <MemberSelector />
      </div>
    </header>
  )
}
