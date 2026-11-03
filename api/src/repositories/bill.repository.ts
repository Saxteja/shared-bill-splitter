import type { Bill } from '../types/bill.types'

export type HomeMember = {
  id: string
  memberNumber: number
}

export async function findActiveMembersByHomeId(
  db: Env['DB'],
  homeId: string,
): Promise<HomeMember[]> {
  const result = await db
    .prepare(`
      SELECT id, member_number AS memberNumber
      FROM members
      WHERE home_id = ? AND status = 'active'
      ORDER BY member_number ASC
    `)
    .bind(homeId)
    .all<HomeMember>()

  return result.results
}

export async function insertBillWithShares(
  db: Env['DB'],
  bill: Omit<Bill, 'shares'>,
  shares: Bill['shares'],
): Promise<void> {
  const statements = [
    db
      .prepare(`
      INSERT INTO bills (
        id,
        home_id,
        bill_number,
        title,
        total_cents
      )
      VALUES (
        ?,
        ?,
        (SELECT COALESCE(MAX(bill_number), 0) + 1 FROM bills),
        ?,
        ?
      )
    `)
      .bind(bill.id, bill.homeId, bill.title, bill.totalCents),

    ...shares.map((share) =>
      db
        .prepare(`
        INSERT INTO shares (
          id,
          bill_id,
          home_id,
          member_id,
          amount_cents
        )
        VALUES (?, ?, ?, ?, ?)
      `)
        .bind(share.id, bill.id, bill.homeId, share.memberId, share.amountCents),
    ),
  ]

  await db.batch(statements)
}

type BillShareRow = {
  billId: string
  homeId: string
  title: string
  totalCents: number
  shareId: string | null
  memberId: string | null
  amountCents: number | null
  paidAt: string | null
}

export async function findBillsByHomeId(db: Env['DB'], homeId: string): Promise<Bill[]> {
  const result = await db
    .prepare(`
      SELECT
        b.id AS billId,
        b.home_id AS homeId,
        b.title,
        b.total_cents AS totalCents,
        s.id AS shareId,
        s.member_id AS memberId,
        s.amount_cents AS amountCents,
        s.paid_at AS paidAt
      FROM bills b
      LEFT JOIN shares s ON s.bill_id = b.id
      LEFT JOIN members m
        ON m.id = s.member_id
        AND m.home_id = s.home_id
      WHERE b.home_id = ?
      ORDER BY b.rowid ASC, m.member_number ASC
    `)
    .bind(homeId)
    .all<BillShareRow>()

  const bills = new Map<string, Bill>()

  for (const row of result.results) {
    if (!bills.has(row.billId)) {
      bills.set(row.billId, {
        id: row.billId,
        homeId: row.homeId,
        title: row.title,
        totalCents: row.totalCents,
        shares: [],
      })
    }

    if (row.shareId !== null && row.memberId !== null && row.amountCents !== null) {
      bills.get(row.billId)!.shares.push({
        id: row.shareId,
        memberId: row.memberId,
        amountCents: row.amountCents,
        paidAt: row.paidAt,
      })
    }
  }

  return Array.from(bills.values())
}
