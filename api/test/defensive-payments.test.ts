import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

describe('defensive payment tests', () => {
  it('allows only one payment when two requests pay the same share simultaneously', async () => {
    const { homeId } = await createHome(['Asha', 'Rahul'])

    const bill = await createBill(homeId, 1000)
    const billId = bill.body.id
    const shareId = bill.body.shares[0]?.id

    expect(bill.status).toBe(201)
    expect(shareId).toBeDefined()

    const key1 = crypto.randomUUID()
    const key2 = crypto.randomUUID()

    const [first, second] = await Promise.all([
      call('POST', `/api/bills/${billId}/shares/${shareId}/pay`, {
        headers: { 'Idempotency-Key': key1 },
      }),
      call('POST', `/api/bills/${billId}/shares/${shareId}/pay`, {
        headers: { 'Idempotency-Key': key2 },
      }),
    ])

    expect([first.status, second.status].sort()).toEqual([200, 409])

    const winner = first.status === 200 ? first : second
    const winningKey = first.status === 200 ? key1 : key2

    const retry = await call('POST', `/api/bills/${billId}/shares/${shareId}/pay`, {
      headers: { 'Idempotency-Key': winningKey },
    })

    expect(retry.status).toBe(200)
    expect(retry.body).toEqual(winner.body)
  })

  it('rejects reuse of an idempotency key for a different share', async () => {
    const { homeId, members } = await createHome(['Asha', 'Rahul'])

    const bill = await createBill(homeId, 1000)
    const billId = bill.body.id
    const firstShare = bill.body.shares[0]
    const secondShare = bill.body.shares[1]

    expect(firstShare).toBeDefined()
    expect(secondShare).toBeDefined()

    const key = crypto.randomUUID()

    const first = await call('POST', `/api/bills/${billId}/shares/${firstShare!.id}/pay`, {
      headers: { 'Idempotency-Key': key },
    })

    const second = await call('POST', `/api/bills/${billId}/shares/${secondShare!.id}/pay`, {
      headers: { 'Idempotency-Key': key },
    })

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)

    const outstanding = await call<{
      balances: {
        memberId: string
        name: string
        outstandingCents: number
      }[]
    }>('GET', `/api/homes/${homeId}/balances`)

    expect(outstanding.body.balances).toEqual([
      {
        memberId: members[0]!.id,
        name: 'Asha',
        outstandingCents: 0,
      },
      {
        memberId: members[1]!.id,
        name: 'Rahul',
        outstandingCents: 500,
      },
    ])
  })

  it('rejects a payment retry using the wrong bill ID', async () => {
    const { homeId } = await createHome(['Asha'])

    const bill = await createBill(homeId, 500)
    const share = bill.body.shares[0]!
    const key = crypto.randomUUID()

    const originalPayment = await call(
      'POST',
      `/api/bills/${bill.body.id}/shares/${share.id}/pay`,
      {
        headers: { 'Idempotency-Key': key },
      },
    )

    expect(originalPayment.status).toBe(200)

    const retry = await call('POST', `/api/bills/wrong-bill-id/shares/${share.id}/pay`, {
      headers: { 'Idempotency-Key': key },
    })

    expect(retry.status).toBe(404)
  })
})
