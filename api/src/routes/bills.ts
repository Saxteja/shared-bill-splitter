import { Hono } from 'hono'
import { createBill, getHomeBills } from '../services/bill.service'
import { validateCreateBill } from '../validators/bill.validator'

const billRoutes = new Hono<{ Bindings: Env }>()

billRoutes.get('/:homeId/bills', async (c) => {
  const bills = await getHomeBills(c.env.DB, c.req.param('homeId'))

  if (bills === null) {
    return c.json({ error: 'Home not found' }, 404)
  }

  return c.json({ bills }, 200)
})

billRoutes.post('/:homeId/bills', async (c) => {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const input = validateCreateBill(body)

  if (!input) {
    return c.json({ error: 'Valid bill title and positive integer totalCents are required' }, 422)
  }

  const result = await createBill(c.env.DB, c.req.param('homeId'), input.title, input.totalCents)

  if (result.status === 'home_not_found') {
    return c.json({ error: 'Home not found' }, 404)
  }

  if (result.status === 'no_members') {
    return c.json({ error: 'Cannot create a bill without members' }, 422)
  }

  return c.json(result.bill, 201)
})

export default billRoutes
