import { Hono } from 'hono'
import { createHome, listHomes } from '../services/home.service'
import { validateCreateHome } from '../validators/home.validator'

const homeRoutes = new Hono<{ Bindings: Env }>()

homeRoutes.get('/', async (c) => {
  const homes = await listHomes(c.env.DB)
  return c.json({ homes })
})

homeRoutes.post('/', async (c) => {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const input = validateCreateHome(body)

  if (!input) {
    return c.json({ error: 'Valid home name is required' }, 400)
  }

  const home = await createHome(c.env.DB, input.name)

  return c.json(
    {
      id: home.id,
      name: home.name,
    },
    201,
  )
})

export default homeRoutes
