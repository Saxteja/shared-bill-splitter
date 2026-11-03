export type MemberBalance = {
  memberId: string
  name: string
  outstandingCents: number
}

export async function findBalancesByHomeId(
  db: Env['DB'],
  homeId: string,
): Promise<MemberBalance[]> {
  const result = await db
    .prepare(`
    SELECT
      m.id AS memberId,
      m.name,
      COALESCE(SUM(
        CASE
          WHEN s.paid_at IS NULL THEN s.amount_cents
          ELSE 0
        END
      ), 0) AS outstandingCents
    FROM members m
    LEFT JOIN shares s
      ON s.member_id = m.id
      AND s.home_id = m.home_id
    WHERE m.home_id = ?
    GROUP BY m.id, m.name, m.member_number
    ORDER BY m.member_number ASC
  `)
    .bind(homeId)
    .all<MemberBalance>()

  return result.results
}
