import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

async function patch(path: string) {
  const response = await exports.default.fetch(
    new Request(`http://localhost${path}`, { method: 'PATCH' }),
  )

  return { status: response.status }
}

describe('defensive bill retrieval', () => {
  it('returns bills in creation order', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])

    await createBill(homeId, 1000)

    const secondBill = await call<{ id: string }>('POST', `/api/homes/${homeId}/bills`, {
      body: { title: 'Water', totalCents: 2000 },
    })

    const response = await call<{
      bills: { id: string; title: string }[]
    }>('GET', `/api/homes/${homeId}/bills`)

    expect(response.status).toBe(200)
    expect(response.body.bills.map((bill) => bill.title)).toEqual(['Electricity', 'Water'])
    expect(response.body.bills[1]!.id).toBe(secondBill.body.id)
  })

  it('includes zero-cent shares', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])

    await createBill(homeId, 1)

    const response = await call<{
      bills: {
        totalCents: number
        shares: { amountCents: number }[]
      }[]
    }>('GET', `/api/homes/${homeId}/bills`)

    expect(response.status).toBe(200)
    expect(response.body.bills[0]!.totalCents).toBe(1)
    expect(response.body.bills[0]!.shares.map((share) => share.amountCents)).toEqual([1, 0])
  })

  it('returns the paid timestamp for settled shares', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])
    const bill = await createBill(homeId, 1000)
    const share = bill.body.shares[0]!

    const payment = await call('POST', `/api/bills/${bill.body.id}/shares/${share.id}/pay`, {
      headers: { 'Idempotency-Key': 'bill-read-payment-test' },
    })

    expect(payment.status).toBe(200)

    const response = await call<{
      bills: { shares: { id: string; paidAt: string | null }[] }[]
    }>('GET', `/api/homes/${homeId}/bills`)

    const retrievedShare = response.body.bills[0]!.shares.find((item) => item.id === share.id)

    expect(retrievedShare?.paidAt).toBeTruthy()
  })

  it('retains historical shares for departed members', async () => {
    const { homeId, members } = await createHome(['Asha', 'Ben'])
    await createBill(homeId, 1000)

    const departure = await patch(`/api/homes/${homeId}/members/${members[0]!.id}/depart`)

    expect(departure.status).toBe(200)

    const response = await call<{
      bills: { shares: { memberId: string }[] }[]
    }>('GET', `/api/homes/${homeId}/bills`)

    expect(response.body.bills[0]!.shares.map((share) => share.memberId)).toContain(members[0]!.id)
  })

  it('returns an empty array when a home has no bills', async () => {
    const { homeId } = await createHome(['Asha'])

    const response = await call<{ bills: unknown[] }>('GET', `/api/homes/${homeId}/bills`)

    expect(response.status).toBe(200)
    expect(response.body.bills).toEqual([])
  })

  it('returns 404 for a nonexistent home', async () => {
    const response = await call<{ error: string }>('GET', '/api/homes/does-not-exist/bills')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Home not found')
  })

  it('does not expose bills belonging to another home', async () => {
    const first = await createHome(['Asha'])
    const second = await createHome(['Ben'])

    await createBill(first.homeId, 1000)
    await createBill(second.homeId, 2000)

    const response = await call<{
      bills: { totalCents: number }[]
    }>('GET', `/api/homes/${first.homeId}/bills`)

    expect(response.status).toBe(200)
    expect(response.body.bills).toHaveLength(1)
    expect(response.body.bills[0]!.totalCents).toBe(1000)
  })
})
