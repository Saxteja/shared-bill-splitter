import { Link } from '@tanstack/react-router'
import MemberSelector from '../members/MemberSelector'

/** Header for the functional /split route */
export default function Header({ homeName }: { homeName: string }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        SPLIT LEDGER
      </Link>
      <div className="header-actions">
        {/* Home selector – we only display a neutral label */}
        <button className="home-selector" type="button" disabled>
          {homeName} <span className="chevron">⌄</span>
        </button>
        <span className="header-divider" />
        <MemberSelector />
      </div>
    </header>
  )
}
