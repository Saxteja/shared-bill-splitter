// src/components/layout/SummaryStrip.tsx
import { formatCents } from '../../utils/format'

/** Component showing total, outstanding and settled amounts */
export default function SummaryStrip({
  total,
  outstanding,
  settled,
}: {
  total: number
  outstanding: number
  settled: number
}) {
  return (
    <section className="summary-strip" aria-label="Expense summary">
      <div className="summary-item">
        <span className="summary-label">TOTAL BILLS</span>
        <strong>{formatCents(total)}</strong>
      </div>
      <div className="summary-item">
        <span className="summary-label">OUTSTANDING</span>
        <strong>{formatCents(outstanding)}</strong>
      </div>
      <div className="summary-item">
        <span className="summary-label">SETTLED</span>
        <strong>{formatCents(settled)}</strong>
      </div>
    </section>
  )
}
