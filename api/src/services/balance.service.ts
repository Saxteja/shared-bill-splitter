import { findBalancesByHomeId, type MemberBalance } from '../repositories/balance.repository'
import { findHomeById } from '../repositories/home.repository'

export type GetBalancesResult =
  | { status: 'home_not_found' }
  | { status: 'found'; balances: MemberBalance[] }

export async function getBalances(db: Env['DB'], homeId: string): Promise<GetBalancesResult> {
  const home = await findHomeById(db, homeId)

  if (!home) {
    return { status: 'home_not_found' }
  }

  const balances = await findBalancesByHomeId(db, homeId)

  return {
    status: 'found',
    balances,
  }
}
