// src/components/bills/AddBillDialog.tsx
import { useState } from 'react'
import { api } from '../../api/client'
import type { CreateBillRequest } from '../../types'

interface Props {
  homeId: string
  onClose: () => void
  onSuccess: () => Promise<unknown>
}

export default function AddBillDialog({ homeId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('') // in dollars as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseCents = (value: string): number | null => {
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
    if (!match) return null
    const wholeDollars = BigInt(match[1] ?? '0')
    const fractionalCents = BigInt((match[2] ?? '').padEnd(2, '0') || '0')
    const cents = wholeDollars * 100n + fractionalCents
    if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) return null
    return Number(cents)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const totalCents = parseCents(amount)
    if (!title.trim() || totalCents === null) {
      setError('Please provide a title and a positive amount with up to two decimal places.')
      return
    }
    setLoading(true)
    try {
      const body: CreateBillRequest = { title: title.trim(), totalCents }
      await api.post(`/api/homes/${homeId}/bills`, body)
      await onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bill could not be created.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bill-dialog-title"
      >
        <h2 id="add-bill-dialog-title">Add bill</h2>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Amount (USD)
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 12.34"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Adding…' : 'Add Bill'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
