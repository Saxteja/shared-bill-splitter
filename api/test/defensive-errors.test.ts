import { env, exports } from 'cloudflare:workers'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../src/middleware/error-handler'
import { insertBillWithShares } from '../src/repositories/bill.repository'
import { createHome } from './helpers'

describe('defensive error handling', () => {
  it('returns 400 for malformed JSON when creating a home', async () => {
    const response = await exports.default.fetch(
      new Request('http://localhost/api/homes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"name":',
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Invalid JSON body',
    })
  })

  it('rolls back the bill when share insertion fails', async () => {
    const { homeId, members } = await createHome(['Asha'])

    const billId = crypto.randomUUID()
    const memberId = members[0]!.id

    const bill = {
      id: billId,
      homeId,
      title: 'Rollback test',
      totalCents: 1000,
    }

    const shares = [
      {
        id: crypto.randomUUID(),
        memberId,
        amountCents: 500,
        paidAt: null,
      },
      {
        id: crypto.randomUUID(),
        memberId,
        amountCents: 500,
        paidAt: null,
      },
    ]

    await expect(insertBillWithShares(env.DB, bill, shares)).rejects.toThrow()

    const savedBill = await env.DB.prepare('SELECT COUNT(*) AS count FROM bills WHERE id = ?')
      .bind(billId)
      .first<{ count: number }>()

    const savedShares = await env.DB.prepare(
      'SELECT COUNT(*) AS count FROM shares WHERE bill_id = ?',
    )
      .bind(billId)
      .first<{ count: number }>()

    expect(savedBill?.count).toBe(0)
    expect(savedShares?.count).toBe(0)
  })

  it('returns JSON 404 for an unknown API route', async () => {
    const response = await exports.default.fetch(new Request('http://localhost/api/does-not-exist'))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: 'Route not found',
    })
  })

  it('returns JSON 500 when an unhandled error occurs', async () => {
    const testApp = new Hono()

    testApp.onError(errorHandler)

    testApp.get('/failure', () => {
      throw new Error('Simulated database failure')
    })

    const response = await testApp.request('/failure')

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Internal server error',
    })
  })
})
