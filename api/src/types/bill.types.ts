export type BillShare = {
  id: string
  memberId: string
  amountCents: number
  paidAt: string | null
}

export type Bill = {
  id: string
  homeId: string
  title: string
  totalCents: number
  shares: BillShare[]
}

export type CreateBillInput = {
  title: string
  totalCents: number
}
