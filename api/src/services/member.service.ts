import { findHomeById } from '../repositories/home.repository'
import {
  departMember,
  findMembersByHomeId,
  findNextMemberNumber,
  insertMember,
} from '../repositories/member.repository'
import type { Member } from '../types/member.types'

export async function createMember(
  db: Env['DB'],
  homeId: string,
  name: string,
): Promise<Member | null> {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return null
  }

  const id = crypto.randomUUID()
  const memberNumber = await findNextMemberNumber(db, homeId)

  const member: Member = {
    id,
    homeId,
    membershipCode: `MEM-${id.slice(0, 8).toUpperCase()}`,
    memberNumber,
    name,
  }

  await insertMember(db, member)

  return member
}

export async function removeMemberFromHome(
  db: Env['DB'],
  homeId: string,
  memberId: string,
): Promise<boolean> {
  return departMember(db, homeId, memberId)
}

export async function getHomeMembers(db: Env['DB'], homeId: string) {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return null
  }

  return findMembersByHomeId(db, homeId)
}
