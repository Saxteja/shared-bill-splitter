import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { insertMember } from '../src/repositories/member.repository'
import type { Member } from '../src/types/member.types'
import { call, createHome } from './helpers'

async function departMember(homeId: string, memberId: string) {
  const response = await exports.default.fetch(
    new Request(`http://localhost/api/homes/${homeId}/members/${memberId}/depart`, {
      method: 'PATCH',
    }),
  )
  return response.status
}

describe('household member name uniqueness', () => {
  it('rejects an exact duplicate without creating a member', async () => {
    const { homeId } = await createHome(['Asha'])

    const duplicate = await call<{ error: string }>('POST', `/api/homes/${homeId}/members`, {
      body: { name: 'Asha' },
    })
    const members = await call<{ members: { name: string }[] }>(
      'GET',
      `/api/homes/${homeId}/members`,
    )

    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error).toContain('already exists')
    expect(members.body.members).toHaveLength(1)
  })

  it('rejects a case-only name difference', async () => {
    const { homeId } = await createHome(['Asha'])

    const duplicate = await call('POST', `/api/homes/${homeId}/members`, {
      body: { name: 'asha' },
    })

    expect(duplicate.status).toBe(409)
  })

  it('rejects a name that differs only by surrounding whitespace', async () => {
    const { homeId } = await createHome(['Asha'])

    const duplicate = await call('POST', `/api/homes/${homeId}/members`, {
      body: { name: '  asha \t' },
    })

    expect(duplicate.status).toBe(409)
  })

  it('accepts a similar but distinct name', async () => {
    const { homeId } = await createHome(['Asha'])

    const distinct = await call<{ name: string }>('POST', `/api/homes/${homeId}/members`, {
      body: { name: 'Asha.V' },
    })

    expect(distinct.status).toBe(201)
    expect(distinct.body.name).toBe('Asha.V')
  })

  it('accepts the same name in a different household', async () => {
    const homeA = await createHome(['Asha'])
    const homeB = await createHome([])

    const member = await call<{ name: string }>('POST', `/api/homes/${homeB.homeId}/members`, {
      body: { name: 'Asha' },
    })

    expect(member.status).toBe(201)
    expect(member.body.name).toBe('Asha')
    expect(homeA.homeId).not.toBe(homeB.homeId)
  })

  it('does not allow reusing a departed member name', async () => {
    const { homeId, members } = await createHome(['Asha'])
    const formerMember = members[0]
    if (!formerMember) throw new Error('Expected a member')

    expect(await departMember(homeId, formerMember.id)).toBe(200)

    const duplicate = await call('POST', `/api/homes/${homeId}/members`, {
      body: { name: 'ASHA' },
    })

    expect(duplicate.status).toBe(409)
  })

  it('rejects concurrent duplicate creations with only one inserted member', async () => {
    const { homeId } = await createHome([])

    const [first, second] = await Promise.all([
      call('POST', `/api/homes/${homeId}/members`, { body: { name: 'Asha' } }),
      call('POST', `/api/homes/${homeId}/members`, { body: { name: 'asha' } }),
    ])
    const members = await call<{ members: { name: string }[] }>(
      'GET',
      `/api/homes/${homeId}/members`,
    )

    expect([first.status, second.status].sort()).toEqual([201, 409])
    expect(members.body.members).toHaveLength(1)
  })

  it('uses the database index to reject concurrent duplicate inserts', async () => {
    const { homeId } = await createHome([])
    const first: Member = {
      id: crypto.randomUUID(),
      homeId,
      membershipCode: `MEM-${crypto.randomUUID().slice(0, 8)}`,
      memberNumber: 1,
      name: 'Asha',
    }
    const second: Member = {
      id: crypto.randomUUID(),
      homeId,
      membershipCode: `MEM-${crypto.randomUUID().slice(0, 8)}`,
      memberNumber: 2,
      name: 'asha',
    }

    const insertions = await Promise.allSettled([
      insertMember(env.DB, first),
      insertMember(env.DB, second),
    ])

    expect(insertions.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(insertions.filter((result) => result.status === 'rejected')).toHaveLength(1)
  })
})
