import { describe, expect, it } from 'vitest'
import { call, createHome } from './helpers'

describe('defensive home listing', () => {
  it('returns an empty list when no homes exist', async () => {
    const result = await call<{ homes: { id: string; name: string }[] }>('GET', '/api/homes')

    expect(result.status).toBe(200)
    expect(result.body).toEqual({ homes: [] })
  })

  it('lists homes with their real IDs and names', async () => {
    const first = await createHome([])
    const second = await createHome([])

    const result = await call<{ homes: { id: string; name: string }[] }>('GET', '/api/homes')

    expect(result.status).toBe(200)
    expect(result.body.homes).toEqual(
      expect.arrayContaining([
        { id: first.homeId, name: 'Test home' },
        { id: second.homeId, name: 'Test home' },
      ]),
    )
    expect(result.body.homes).toHaveLength(2)
  })
})
