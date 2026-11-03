// src/utils/bill-calculations.ts
/**
 * Pure financial calculation helpers used by the UI.
 * All functions operate on raw API data (cents) and return numbers in cents.
 */
import type { Balance, Bill } from '../types'

/** Sum of all bill totalCents */
export const totalBills = (bills: Bill[]): number => {
  return bills.reduce((sum, b) => sum + b.totalCents, 0)
}

/** Sum of all outstanding cents from balances */
export const outstanding = (balances: Balance[]): number => {
  return balances.reduce((sum, bal) => sum + bal.outstandingCents, 0)
}

/** Settled amount = total - outstanding */
export const settled = (bills: Bill[], balances: Balance[]): number => {
  return totalBills(bills) - outstanding(balances)
}

/** Payment progress for a given bill (paid shares / total shares) */
export const paymentProgress = (bill: Bill): number => {
  const total = bill.shares.length
  if (total === 0) return 0
  const paid = bill.shares.filter((s) => s.paidAt !== null).length
  return paid / total
}
