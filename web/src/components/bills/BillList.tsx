import { useState } from 'react'
import type { Bill } from '../../types'
import AddBillDialog from './AddBillDialog'
import BillCard from './BillCard'

interface Props {
  bills: Bill[]
  selectedBillId: string
  onSelect: (id: string) => void
  homeId: string
  onRefresh: () => Promise<unknown>
  hasActiveMembers: boolean
}

export default function BillList({
  bills,
  selectedBillId,
  onSelect,
  homeId,
  onRefresh,
  hasActiveMembers,
}: Props) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="bill-list-panel">
      <div className="section-heading">
        <div className="section-title-group">
          <h2>Bills</h2>
          <span className="item-count">{bills.length} items</span>
        </div>
        <button
          className="primary-button add-bill-button"
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={!hasActiveMembers}
          title={!hasActiveMembers ? 'An active member is required to create a bill.' : undefined}
        >
          <span aria-hidden="true">＋</span> Add bill
        </button>
      </div>
      {!hasActiveMembers && (
        <p className="notice-state" role="status">
          A bill needs at least one active member. No active members are available for this
          household.
        </p>
      )}
      {bills.length === 0 ? (
        <p className="empty-list-state">No bills yet. Add a bill to start sharing expenses.</p>
      ) : (
        <div className="bill-list">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              selected={bill.id === selectedBillId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
      {showAdd && hasActiveMembers && (
        <AddBillDialog homeId={homeId} onClose={() => setShowAdd(false)} onSuccess={onRefresh} />
      )}
    </div>
  )
}
