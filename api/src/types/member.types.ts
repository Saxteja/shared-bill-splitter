export type Member = {
  id: string
  homeId: string
  membershipCode: string
  memberNumber: number
  name: string
}

export type CreateMemberInput = {
  name: string
}
