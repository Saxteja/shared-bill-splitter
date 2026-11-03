import type { Bill } from '../../types'
import { formatCents } from '../../utils/format'

interface Props {
  bill: Bill
  selected: boolean
  onSelect: (id: string) => void
}

export default function BillCard({ bill, selected, onSelect }: Props) {
  const paidCount = bill.shares.filter((share) => share.paidAt !== null).length
  const totalShares = bill.shares.length
  const allPaid = totalShares > 0 && paidCount === totalShares
  const nonePaid = totalShares > 0 && paidCount === 0
  const badgeClass = allPaid ? 'all-paid' : nonePaid ? 'none-paid' : ''

  return (
    <button
      type="button"
      className={`bill-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(bill.id)}
      aria-pressed={selected}
    >
      <div className="bill-information">
        <h3>{bill.title}</h3>
      </div>
      <div className="bill-amount">
        <strong>{formatCents(bill.totalCents)}</strong>
        <span>
          {totalShares} {totalShares === 1 ? 'share' : 'shares'}
        </span>
      </div>
      <div className={`progress-badge ${badgeClass}`}>
        {totalShares > 0 ? `${paidCount} / ${totalShares} paid` : 'No shares'}
      </div>
      <span className="view-shares">
        View shares <span aria-hidden="true">→</span>
      </span>
    </button>
  )
}
