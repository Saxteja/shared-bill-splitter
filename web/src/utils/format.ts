// src/utils/format.ts
/**
 * Format integer cents as USD currency string (e.g., 12345 => $123.45).
 * No grouping commas per assignment visual style – keep simple.
 */
export function formatCents(cents: number): string {
  const dollars = cents / 100
  // Ensure two decimal places, even for whole dollars
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
