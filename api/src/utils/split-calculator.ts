export function calculateShares(
  totalCents: number,
  memberIds: string[],
): { memberId: string; amountCents: number }[] {
  if (memberIds.length === 0) {
    throw new Error('Cannot split a bill without members')
  }

  const baseAmount = Math.floor(totalCents / memberIds.length)
  const remainder = totalCents % memberIds.length

  return memberIds.map((memberId, index) => ({
    memberId,
    amountCents: baseAmount + (index < remainder ? 1 : 0),
  }))
}
