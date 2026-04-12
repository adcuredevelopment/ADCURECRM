/**
 * Fee calculation utilities for ad account top-ups.
 * VAT (21%) applies ONLY to the service fee, NOT to the ad amount itself.
 */

export interface FeeBreakdown {
  /** Amount going to the ad account (euros) */
  adAmount: number
  /** Service fee (adAmount * feePercentage / 100) */
  fee: number
  /** VAT over the fee only (fee * 0.21) */
  vat: number
  /** Total to pay (adAmount + fee + vat) */
  total: number
}

/**
 * Calculate the fee breakdown for a given ad account top-up amount.
 *
 * @param amount - Ad account amount in euros (not cents)
 * @param feePercentage - Fee percentage (e.g. 5 for 5%)
 * @returns FeeBreakdown with all amounts in euros
 */
export function calculateFee(amount: number, feePercentage: number): FeeBreakdown {
  const fee = amount * (feePercentage / 100)
  const vat = fee * 0.21
  const total = amount + fee + vat

  return {
    adAmount: Math.round(amount * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}
