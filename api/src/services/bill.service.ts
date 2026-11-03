import {
  findActiveMembersByHomeId,
  findBillsByHomeId,
  insertBillWithShares,
} from '../repositories/bill.repository'
import { findHomeById } from '../repositories/home.repository'
import type { Bill } from '../types/bill.types'
import { calculateShares } from '../utils/split-calculator'

export type CreateBillResult =
  | { status: 'home_not_found' }
  | { status: 'no_members' }
  | { status: 'created'; bill: Bill }

export async function createBill(
  db: Env['DB'],
  homeId: string,
  title: string,
  totalCents: number,
): Promise<CreateBillResult> {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return { status: 'home_not_found' }
  }

  const members = await findActiveMembersByHomeId(db, homeId)

  if (members.length === 0) {
    return { status: 'no_members' }
  }

  const id = crypto.randomUUID()

  const bill: Omit<Bill, 'shares'> = {
    id,
    homeId,
    title,
    totalCents,
  }

  const calculatedShares = calculateShares(
    totalCents,
    members.map((member) => member.id),
  )

  const shares = calculatedShares.map((share) => ({
    id: crypto.randomUUID(),
    ...share,
    paidAt: null,
  }))

  await insertBillWithShares(db, bill, shares)

  return {
    status: 'created',
    bill: { ...bill, shares },
  }
}

export async function getHomeBills(db: Env['DB'], homeId: string) {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return null
  }

  return findBillsByHomeId(db, homeId)
}
