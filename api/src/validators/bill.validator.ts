import type { CreateBillInput } from '../types/bill.types'

export function validateCreateBill(body: unknown): CreateBillInput | null {
  if (typeof body !== 'object' || body === null) {
    return null
  }

  if (!('title' in body) || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return null
  }

  if (
    !('totalCents' in body) ||
    typeof body.totalCents !== 'number' ||
    !Number.isSafeInteger(body.totalCents) ||
    body.totalCents <= 0
  ) {
    return null
  }

  return {
    title: body.title.trim(),
    totalCents: body.totalCents,
  }
}
