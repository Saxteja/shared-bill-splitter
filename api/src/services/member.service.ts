import { findHomeById } from '../repositories/home.repository'
import {
  departMember,
  findMembersByHomeId,
  findNextMemberNumber,
  insertMember,
  memberNameExists,
} from '../repositories/member.repository'
import type { Member } from '../types/member.types'

export type CreateMemberResult =
  | { status: 'home_not_found' }
  | { status: 'name_conflict' }
  | { status: 'created'; member: Member }

export async function createMember(
  db: Env['DB'],
  homeId: string,
  name: string,
): Promise<CreateMemberResult> {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return { status: 'home_not_found' }
  }

  const normalizedName = name.trim()
  if (await memberNameExists(db, homeId, normalizedName)) {
    return { status: 'name_conflict' }
  }

  const id = crypto.randomUUID()
  const memberNumber = await findNextMemberNumber(db, homeId)

  const member: Member = {
    id,
    homeId,
    membershipCode: `MEM-${id.slice(0, 8).toUpperCase()}`,
    memberNumber,
    name: normalizedName,
  }

  try {
    await insertMember(db, member)
  } catch (error) {
    // Another request may have inserted the same normalized name after the precheck.
    if (await memberNameExists(db, homeId, normalizedName)) {
      return { status: 'name_conflict' }
    }
    throw error
  }

  return { status: 'created', member }
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
