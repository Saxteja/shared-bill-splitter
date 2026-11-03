export type Payment = {
  id: string
  paymentReference: string
  shareId: string
  memberId: string
  amountCents: number
  idempotencyKey: string
  paidAt: string
}

export type SharePaymentState = {
  id: string
  billId: string
  memberId: string
  amountCents: number
  paidAt: string | null
}

export async function findPaymentByIdempotencyKey(
  db: Env['DB'],
  idempotencyKey: string,
): Promise<Payment | null> {
  return db
    .prepare(`
    SELECT
      p.id,
      p.payment_reference AS paymentReference,
      p.share_id AS shareId,
      s.member_id AS memberId,
      p.amount_cents AS amountCents,
      p.idempotency_key AS idempotencyKey,
      p.paid_at AS paidAt
    FROM payments p
    JOIN shares s ON s.id = p.share_id
    WHERE p.idempotency_key = ?
  `)
    .bind(idempotencyKey)
    .first<Payment>()
}

export async function findPaymentByShareId(
  db: Env['DB'],
  shareId: string,
): Promise<Payment | null> {
  return db
    .prepare(`
    SELECT
      p.id,
      p.payment_reference AS paymentReference,
      p.share_id AS shareId,
      s.member_id AS memberId,
      p.amount_cents AS amountCents,
      p.idempotency_key AS idempotencyKey,
      p.paid_at AS paidAt
    FROM payments p
    JOIN shares s ON s.id = p.share_id
    WHERE p.share_id = ?
  `)
    .bind(shareId)
    .first<Payment>()
}

export async function findShareForPayment(
  db: Env['DB'],
  billId: string,
  shareId: string,
): Promise<SharePaymentState | null> {
  return db
    .prepare(`
    SELECT
      id,
      bill_id AS billId,
      member_id AS memberId,
      amount_cents AS amountCents,
      paid_at AS paidAt
    FROM shares
    WHERE id = ? AND bill_id = ?
  `)
    .bind(shareId, billId)
    .first<SharePaymentState>()
}

export async function recordPayment(
  db: Env['DB'],
  share: SharePaymentState,
  idempotencyKey: string,
): Promise<void> {
  const paymentId = crypto.randomUUID()
  const paymentReference = `PAY-${paymentId.slice(0, 8).toUpperCase()}`

  const result = await db.batch([
    db
      .prepare(`
      UPDATE shares
      SET paid_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
        AND bill_id = ?
        AND paid_at IS NULL
    `)
      .bind(share.id, share.billId),

    db
      .prepare(`
      INSERT INTO payments (
        id,
        payment_reference,
        share_id,
        amount_cents,
        idempotency_key
      )
      SELECT
        ?,
        ?,
        s.id,
        s.amount_cents,
        ?
      FROM shares s
      WHERE s.id = ?
        AND s.bill_id = ?
        AND s.paid_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payments p WHERE p.share_id = s.id
        )
    `)
      .bind(paymentId, paymentReference, idempotencyKey, share.id, share.billId),
  ])

  if (!result[1]?.meta.changes) {
    throw new Error('Payment was not recorded')
  }
}
