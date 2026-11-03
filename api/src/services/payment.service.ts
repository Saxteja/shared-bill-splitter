import {
  findPaymentByIdempotencyKey,
  findPaymentByShareId,
  findShareForPayment,
  type Payment,
  recordPayment,
} from '../repositories/payment.repository'

export type PayShareResult =
  | { status: 'not_found' }
  | { status: 'conflict' }
  | { status: 'paid'; payment: Payment }

export async function payShare(
  db: Env['DB'],
  billId: string,
  shareId: string,
  idempotencyKey: string,
): Promise<PayShareResult> {
  // First verify that the share belongs to the supplied bill.
  const share = await findShareForPayment(db, billId, shareId)

  if (!share) {
    return { status: 'not_found' }
  }

  // Then check whether this idempotency key was already used.
  const existingByKey = await findPaymentByIdempotencyKey(db, idempotencyKey)

  if (existingByKey) {
    return existingByKey.shareId === shareId
      ? { status: 'paid', payment: existingByKey }
      : { status: 'conflict' }
  }

  // A share already paid with another key cannot be paid again.
  const existingByShare = await findPaymentByShareId(db, shareId)

  if (existingByShare) {
    return { status: 'conflict' }
  }

  if (share.paidAt !== null) {
    return { status: 'conflict' }
  }

  try {
    await recordPayment(db, share, idempotencyKey)
  } catch {
    // Another request may have completed the payment concurrently.
    const paymentByKey = await findPaymentByIdempotencyKey(db, idempotencyKey)

    if (paymentByKey) {
      return paymentByKey.shareId === shareId
        ? { status: 'paid', payment: paymentByKey }
        : { status: 'conflict' }
    }

    const paymentByShare = await findPaymentByShareId(db, shareId)

    if (paymentByShare) {
      return { status: 'conflict' }
    }

    throw new Error('Unable to record payment')
  }

  const payment = await findPaymentByIdempotencyKey(db, idempotencyKey)

  if (!payment) {
    throw new Error('Payment was not found after recording')
  }

  return { status: 'paid', payment }
}
