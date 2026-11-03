import { useRef, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type { Bill, Share } from '../../types'
import { formatCents } from '../../utils/format'

interface Props {
  billId: string
  share: Share
  onClose: () => void
  onSuccess: () => Promise<{ bills: Bill[] } | null>
}

export default function PaymentDialog({ billId, share, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const idempotencyKey = useRef<string | null>(null)

  const reconcile = async (): Promise<boolean> => {
    try {
      const refreshed = await onSuccess()
      return (
        refreshed?.bills
          .find((bill) => bill.id === billId)
          ?.shares.some((item) => item.id === share.id && item.paidAt !== null) ?? false
      )
    } catch {
      return false
    }
  }

  const handlePay = async () => {
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    setError(null)
    idempotencyKey.current ??= crypto.randomUUID()

    try {
      await api.post(
        `/api/bills/${encodeURIComponent(billId)}/shares/${encodeURIComponent(share.id)}/pay`,
        {},
        { 'Idempotency-Key': idempotencyKey.current },
      )
      if (await reconcile()) onClose()
      else
        setError(
          'Payment response received, but the latest share status could not be confirmed. Retry to reconcile safely.',
        )
    } catch (caught: unknown) {
      const ambiguous = !(caught instanceof ApiError) || [404, 409, 500].includes(caught.status)
      if (ambiguous) {
        if (await reconcile()) onClose()
        else if (caught instanceof ApiError && caught.status === 404) {
          setError(
            'The bill or share could not be found. Household data was refreshed; check the current share status.',
          )
        } else if (caught instanceof ApiError && caught.status === 409) {
          setError(
            'The payment conflicts with the current share status. Household data was refreshed; retry only if it remains unpaid.',
          )
        } else {
          setError(
            'The payment outcome is uncertain. Household data was refreshed; retrying will reuse the same payment key.',
          )
        }
      } else {
        setError(caught instanceof Error ? caught.message : 'Payment could not be completed.')
      }
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
      >
        <h2 id="payment-dialog-title">Pay share</h2>
        <p>Amount: {formatCents(share.amountCents)}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={loading} className="secondary-button">
            Cancel
          </button>
          <button type="button" onClick={handlePay} disabled={loading} className="primary-button">
            {loading ? 'Checking payment…' : 'Confirm payment'}
          </button>
        </div>
      </section>
    </div>
  )
}
