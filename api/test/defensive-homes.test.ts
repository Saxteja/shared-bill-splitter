import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

describe('defensive home isolation tests', () => {
  it('does not allow a member from another home to receive a share', async () => {
    const homeA = await createHome(['Asha'])
    const homeB = await createHome(['Rahul'])

    const result = await call<{
      id: string
      homeId: string
      title: string
      totalCents: number
      shares: {
        id: string
        memberId: string
        amountCents: number
        paidAt: string | null
      }[]
    }>('POST', `/api/homes/${homeA.homeId}/bills`, {
      body: { title: 'Electricity', totalCents: 500 },
    })

    expect(result.status).toBe(201)
    expect(result.body.shares[0]!.memberId).toBe(homeA.members[0]!.id)
    expect(result.body.shares[0]!.memberId).not.toBe(homeB.members[0]!.id)
  })

  it('does not allow a bill from one home to pay a share from another home', async () => {
    const homeA = await createHome(['Asha'])
    const homeB = await createHome(['Rahul'])

    const billA = await createBill(homeA.homeId, 500)
    const billB = await createBill(homeB.homeId, 500)

    const shareA = billA.body.shares[0]!

    const result = await call('POST', `/api/bills/${billB.body.id}/shares/${shareA.id}/pay`, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    })

    expect(result.status).toBe(404)

    const balancesA = await call<{
      balances: { outstandingCents: number }[]
    }>('GET', `/api/homes/${homeA.homeId}/balances`)

    const balancesB = await call<{
      balances: { outstandingCents: number }[]
    }>('GET', `/api/homes/${homeB.homeId}/balances`)

    expect(balancesA.body.balances[0]!.outstandingCents).toBe(500)
    expect(balancesB.body.balances[0]!.outstandingCents).toBe(500)
  })

  it('keeps bills and balances isolated between homes', async () => {
    const homeA = await createHome(['Asha'])
    const homeB = await createHome(['Rahul'])

    await createBill(homeA.homeId, 1200)
    await createBill(homeB.homeId, 800)

    const balancesA = await call<{
      balances: { memberId: string; name: string; outstandingCents: number }[]
    }>('GET', `/api/homes/${homeA.homeId}/balances`)

    const balancesB = await call<{
      balances: { memberId: string; name: string; outstandingCents: number }[]
    }>('GET', `/api/homes/${homeB.homeId}/balances`)

    expect(balancesA.body.balances).toEqual([
      {
        memberId: homeA.members[0]!.id,
        name: 'Asha',
        outstandingCents: 1200,
      },
    ])

    expect(balancesB.body.balances).toEqual([
      {
        memberId: homeB.members[0]!.id,
        name: 'Rahul',
        outstandingCents: 800,
      },
    ])
  })
})
