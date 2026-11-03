import { Hono } from 'hono'
import { createMember, getHomeMembers, removeMemberFromHome } from '../services/member.service'
import { validateCreateMember } from '../validators/member.validator'

const memberRoutes = new Hono<{ Bindings: Env }>()

memberRoutes.get('/:homeId/members', async (c) => {
  const members = await getHomeMembers(c.env.DB, c.req.param('homeId'))

  if (members === null) {
    return c.json({ error: 'Home not found' }, 404)
  }

  return c.json({ members }, 200)
})

memberRoutes.post('/:homeId/members', async (c) => {
  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const input = validateCreateMember(body)

  if (!input) {
    return c.json({ error: 'Valid member name is required' }, 400)
  }

  const member = await createMember(c.env.DB, c.req.param('homeId'), input.name)

  if (!member) {
    return c.json({ error: 'Home not found' }, 404)
  }

  return c.json(
    {
      id: member.id,
      homeId: member.homeId,
      name: member.name,
    },
    201,
  )
})

memberRoutes.patch('/:homeId/members/:memberId/depart', async (c) => {
  const departed = await removeMemberFromHome(
    c.env.DB,
    c.req.param('homeId'),
    c.req.param('memberId'),
  )

  if (!departed) {
    return c.json(
      { error: 'Member not found, already departed, or does not belong to this home' },
      404,
    )
  }

  return c.json({ message: 'Member departed successfully' }, 200)
})

export default memberRoutes
