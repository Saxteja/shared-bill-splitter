import { Hono } from 'hono'
import { payShare } from '../services/payment.service'

const shareRoutes = new Hono<{ Bindings: Env }>()

shareRoutes.post('/:billId/shares/:shareId/pay', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key')?.trim()

  if (!idempotencyKey) {
    return c.json({ error: 'Idempotency-Key header is required' }, 400)
  }

  const result = await payShare(
    c.env.DB,
    c.req.param('billId'),
    c.req.param('shareId'),
    idempotencyKey,
  )

  if (result.status === 'not_found') {
    return c.json({ error: 'Bill or share not found' }, 404)
  }

  if (result.status === 'conflict') {
    return c.json({ error: 'Share has already been paid or idempotency key was used' }, 409)
  }

  return c.json(
    {
      id: result.payment.shareId,
      memberId: result.payment.memberId,
      amountCents: result.payment.amountCents,
      paidAt: result.payment.paidAt,
    },
    200,
  )
})

export default shareRoutes
