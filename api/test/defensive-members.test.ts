import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { call, createBill, createHome } from './helpers'

async function patch(path: string) {
  const response = await exports.default.fetch(
    new Request(`http://localhost${path}`, {
      method: 'PATCH',
    }),
  )

  return {
    status: response.status,
    body: (await response.json()) as { message?: string; error?: string },
  }
}

describe('defensive member tests', () => {
  it('preserves historical bill shares when a member departs', async () => {
    const { homeId, members } = await createHome(['Asha', 'Rahul'])

    const bill = await createBill(homeId, 1000)
    expect(bill.status).toBe(201)

    const departure = await patch(`/api/homes/${homeId}/members/${members[0]!.id}/depart`)

    expect(departure.status).toBe(200)

    const balances = await call<{
      balances: {
        memberId: string
        name: string
        outstandingCents: number
      }[]
    }>('GET', `/api/homes/${homeId}/balances`)

    expect(balances.body.balances).toEqual([
      {
        memberId: members[0]!.id,
        name: 'Asha',
        outstandingCents: 500,
      },
      {
        memberId: members[1]!.id,
        name: 'Rahul',
        outstandingCents: 500,
      },
    ])
  })

  it('excludes departed members from newly created bills', async () => {
    const { homeId, members } = await createHome(['Asha', 'Rahul'])

    const departure = await patch(`/api/homes/${homeId}/members/${members[0]!.id}/depart`)
    expect(departure.status).toBe(200)

    const bill = await createBill(homeId, 900)

    expect(bill.status).toBe(201)
    expect(bill.body.shares).toHaveLength(1)
    expect(bill.body.shares[0]).toMatchObject({
      memberId: members[1]!.id,
      amountCents: 900,
    })
  })

  it('rejects a member who has already departed', async () => {
    const { homeId, members } = await createHome(['Asha'])

    const path = `/api/homes/${homeId}/members/${members[0]!.id}/depart`

    const first = await patch(path)
    const second = await patch(path)

    expect(first.status).toBe(200)
    expect(second.status).toBe(404)
  })

  it('returns all members in addition order, including departed members', async () => {
    const { homeId, members } = await createHome(['Asha', 'Rahul', 'Chitra'])

    await patch(`/api/homes/${homeId}/members/${members[1]!.id}/depart`)

    const response = await call<{
      members: {
        id: string
        name: string
        memberNumber: number
        status: 'active' | 'departed'
      }[]
    }>('GET', `/api/homes/${homeId}/members`)

    expect(response.status).toBe(200)
    expect(response.body.members.map((member) => member.name)).toEqual(['Asha', 'Rahul', 'Chitra'])
    expect(response.body.members.map((member) => member.status)).toEqual([
      'active',
      'departed',
      'active',
    ])
  })

  it('returns an empty array when a home has no members', async () => {
    const { homeId } = await createHome([])

    const response = await call<{ members: unknown[] }>('GET', `/api/homes/${homeId}/members`)

    expect(response.status).toBe(200)
    expect(response.body.members).toEqual([])
  })

  it('returns 404 when retrieving members from a nonexistent home', async () => {
    const response = await call<{ error: string }>('GET', '/api/homes/does-not-exist/members')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Home not found')
  })
})
