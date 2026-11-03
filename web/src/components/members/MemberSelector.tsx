// src/components/members/MemberSelector.tsx

import { memberInitials } from '../../utils/format'
import { useMemberContext } from './MemberContext'

/** Dropdown selector showing avatar with initials and member names */
export default function MemberSelector() {
  const { selectedMemberId, setSelectedMemberId, members } = useMemberContext()
  const current = members.find((m) => m.id === selectedMemberId)
  return (
    <label className="member-selector" title="Select member">
      <span className="member-avatar" aria-hidden="true">
        {current ? memberInitials(current.name) : '—'}
      </span>
      <select
        aria-label="Current member"
        value={selectedMemberId}
        onChange={(e) => setSelectedMemberId(e.target.value)}
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.status === 'departed' ? ' (departed)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
