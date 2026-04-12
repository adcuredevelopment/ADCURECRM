/**
 * Currency utility functions for converting between cents and euros.
 * All amounts in the database are stored as cents (integers).
 */

/**
 * Convert cents to euros (integer division).
 * @param cents - Amount in cents (e.g. 1050 → 10.50)
 */
export function centsToEuros(cents: number): number {
  return cents / 100
}

/**
 * Convert euros to cents (multiply and round to avoid float issues).
 * @param euros - Amount in euros (e.g. 10.50 → 1050)
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Format a cents amount as a localized currency string.
 * @param cents - Amount in cents
 * @param currency - ISO currency code (default: 'EUR')
 * @returns Formatted string like "€10.50"
 */
export function formatCurrency(cents: number, currency: string = 'EUR'): string {
  const euros = centsToEuros(cents)
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros)
}
