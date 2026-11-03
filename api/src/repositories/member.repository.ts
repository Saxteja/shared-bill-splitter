import type { Member } from '../types/member.types'

export async function memberNameExists(
  db: Env['DB'],
  homeId: string,
  name: string,
): Promise<boolean> {
  const existing = await db
    .prepare(`
      SELECT id
      FROM members
      WHERE home_id = ?
        AND lower(trim(name)) = lower(trim(?))
      LIMIT 1
    `)
    .bind(homeId, name)
    .first<{ id: string }>()

  return existing !== null
}

export async function insertMember(db: Env['DB'], member: Member): Promise<void> {
  await db
    .prepare(`
      INSERT INTO members (
        id,
        home_id,
        user_id,
        membership_code,
        member_number,
        name
      )
      VALUES (?, ?, NULL, ?, ?, ?)
    `)
    .bind(member.id, member.homeId, member.membershipCode, member.memberNumber, member.name)
    .run()
}

export async function findNextMemberNumber(db: Env['DB'], homeId: string): Promise<number> {
  const result = await db
    .prepare(`
      SELECT COALESCE(MAX(member_number), 0) + 1 AS next_number
      FROM members
      WHERE home_id = ?
    `)
    .bind(homeId)
    .first<{ next_number: number }>()

  return result?.next_number ?? 1
}

export async function departMember(
  db: Env['DB'],
  homeId: string,
  memberId: string,
): Promise<boolean> {
  const result = await db
    .prepare(`
      UPDATE members
      SET
        status = 'departed',
        departed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
        AND home_id = ?
        AND status = 'active'
    `)
    .bind(memberId, homeId)
    .run()

  return result.meta.changes === 1
}

export type HomeMemberDetails = {
  id: string
  homeId: string
  membershipCode: string
  memberNumber: number
  name: string
  status: 'active' | 'departed'
}

export async function findMembersByHomeId(
  db: Env['DB'],
  homeId: string,
): Promise<HomeMemberDetails[]> {
  const result = await db
    .prepare(`
      SELECT
        id,
        home_id AS homeId,
        membership_code AS membershipCode,
        member_number AS memberNumber,
        name,
        status
      FROM members
      WHERE home_id = ?
      ORDER BY member_number ASC
    `)
    .bind(homeId)
    .all<HomeMemberDetails>()

  return result.results
}
