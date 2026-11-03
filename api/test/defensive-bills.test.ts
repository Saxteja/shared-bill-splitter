import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

describe('defensive bill splitting', () => {
  it('supports a positive total smaller than the number of members', async () => {
    const { homeId, members } = await createHome(['Asha', 'Ben'])

    const bill = await createBill(homeId, 1)

    expect(bill.status).toBe(201)
    expect(bill.body.shares.map((share) => share.memberId)).toEqual(
      members.map((member) => member.id),
    )
    expect(bill.body.shares.map((share) => share.amountCents)).toEqual([1, 0])
    expect(bill.body.shares.reduce((total, share) => total + share.amountCents, 0)).toBe(1)
    expect(bill.body.shares.every((share) => share.paidAt === null)).toBe(true)
  })

  it('allows a zero-cent share to be paid', async () => {
    const { homeId } = await createHome(['Asha', 'Ben'])
    const bill = await createBill(homeId, 1)

    expect(bill.status).toBe(201)

    const zeroShare = bill.body.shares.find((share) => share.amountCents === 0)

    expect(zeroShare).toBeDefined()

    if (!zeroShare) {
      throw new Error('Expected a zero-cent share')
    }

    const payment = await call('POST', `/api/bills/${bill.body.id}/shares/${zeroShare.id}/pay`, {
      headers: { 'Idempotency-Key': 'zero-cent-payment-test' },
    })

    expect(payment.status).toBe(200)

    const paymentBody = payment.body as {
      amountCents: number
      memberId: string
      paidAt: string
    }

    expect(paymentBody.amountCents).toBe(0)
    expect(paymentBody.memberId).toBe(zeroShare.memberId)
    expect(paymentBody.paidAt).toBeTruthy()
  })
})
