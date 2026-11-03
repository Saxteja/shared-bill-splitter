// src/types/index.ts
/**
 * API request / response types for Split Ledger.
 */
export interface Home {
  id: string
  name: string
}

export interface Member {
  id: string
  homeId: string
  membershipCode?: string
  memberNumber?: number
  name: string
  status: 'active' | 'departed'
}

export interface Share {
  id: string
  memberId: string
  amountCents: number
  paidAt: string | null // ISO timestamp when paid, null if unpaid
}

export interface Bill {
  id: string
  homeId: string
  title: string
  totalCents: number
  shares: Share[]
}

export interface Balance {
  memberId: string
  name: string
  outstandingCents: number
}

export interface CreateHomeRequest {
  name: string
}
export interface CreateHomeResponse extends Home {}

export interface AddMemberRequest {
  name: string
}
export interface AddMemberResponse {
  id: string
  homeId: string
  name: string
}

export interface CreateBillRequest {
  title: string
  totalCents: number
}
export interface CreateBillResponse extends Bill {}

export interface PayShareResponse {
  id: string // share id
  memberId: string
  amountCents: number
  paidAt: string
}
