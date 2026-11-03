import { Hono } from 'hono'
import { getBalances } from '../services/balance.service'

const balanceRoutes = new Hono<{ Bindings: Env }>()

balanceRoutes.get('/:homeId/balances', async (c) => {
  const result = await getBalances(c.env.DB, c.req.param('homeId'))

  if (result.status === 'home_not_found') {
    return c.json({ error: 'Home not found' }, 404)
  }

  return c.json(
    {
      balances: result.balances,
    },
    200,
  )
})

export default balanceRoutes
