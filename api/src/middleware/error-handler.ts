import type { ErrorHandler, NotFoundHandler } from 'hono'

export const errorHandler: ErrorHandler = (error, c) => {
  console.error('Unhandled API error:', error)

  return c.json({ error: 'Internal server error' }, 500)
}

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json({ error: 'Route not found' }, 404)
}
